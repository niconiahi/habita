---
name: cli
description: CLI conventions. Use always when running shell commands — covers just recipes and when to avoid raw CLI tools.
---

# CLI Conventions

**Always use `just`.** Never use raw `docker compose`, `npx`, or other CLI tools for project operations.

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
just logs kv                   # Follow key-value cache logs
just logs object               # Follow object storage logs
just logs go                   # Follow Go API logs
just logs consumer-email       # Follow email consumer logs
just logs consumer-subscription # Follow subscription consumer logs
just logs consumer-escalation  # Follow escalation consumer logs
just logs caddy                # Follow reverse proxy logs
just logs image                # Follow image processing logs
just logs redpanda             # Follow message broker logs
just logs ofelia               # Follow scheduler logs
just logs pdf                  # Follow PDF service logs
just logs gatus                # Follow status monitor logs
just logs nominatim            # Follow geocoding logs
just logs tileserver           # Follow tile server logs
just logs autoheal             # Follow autoheal logs
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
just db migrate                # Run pending migrations
just db types                  # Regenerate DB types from current schema
just db seed                   # Run database seeds
just db make add_users_table   # Create a new migration file
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
just deploy image-svelte <image>  # Deploy specific svelte image
just deploy image-go <image>      # Deploy specific go image
```

### SSH (`just ssh`)

```bash
just ssh run                   # Interactive SSH into the server
just ssh run "docker ps"       # Run a command remotely and return output
```

### Zone (`just zone`)

```bash
just zone argentina            # Extract Argentine boundaries from Nominatim
```

## Priority order

1. **`just`** — always check `just --list` first
2. **Raw CLI** — never for project operations

## Remote server access

You can run commands directly on the production server using `just ssh run`. Use this to inspect logs, check container status, debug issues, etc. — no need to ask the user to run commands manually.

```bash
# Run any command on the server
just ssh run "docker ps"
just ssh run "docker logs scheduler-ofelia-1 --tail 50"
just ssh run "docker exec scheduler-backup-worker-1 ls -la /backups/"

# Combine with just commands — the server has just installed at /opt/habita
just ssh run "cd /opt/habita && just status"
just ssh run "cd /opt/habita && just logs svelte"  # note: streaming commands will hang
```

When diagnosing production issues, use `just ssh run` proactively to gather information.

## Bash conventions

- Never add `2>&1` to redirect stderr into stdout. Keep stderr separate so errors are visible and distinguishable from normal output.

## What NOT to do

```bash
# WRONG — raw docker compose
docker compose -f infra/app/docker-compose.yml run --rm svelte pnpm run lint:format

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

---
name: cli
description: CLI conventions. Use always when running shell commands — covers just recipes and when to avoid raw CLI tools.
---

# CLI Conventions

**Always use `just`.** Never use raw `docker compose`, `npx`, or other CLI tools for project operations.

## Recipe Index

### Infrastructure

```
just setup                         # first-run: network, volumes, symlinks, secrets, start all
just up                            # start all services in dependency order
just down                          # stop all services
just ps                            # show all services with status, image, health
just health                        # show unhealthy containers and why
just logs <service>                # follow logs (svelte, db, kv, go, caddy, email, subscription, escalation, redpanda, ofelia, pdf, gatus, nominatim, tileserver, autoheal, image, object, otel-collector, telemetry-db, observability-ui)
just exec <service> <cmd>          # exec into container (e.g., just exec svelte sh)
just restart <service>             # restart a service
just reload <service>              # recreate with latest config
just rebuild <service>             # rebuild with fresh dependencies
just deploy <services>             # deploy services (no args = all)
just build <service>               # build and push image to DockerHub (svelte, go, consumer)
just rollback <service> [version]  # rollback a service
just env-push                      # decrypt and write .env
just env-diff                      # compare .env vs .env.enc
just lock / just unlock            # deploy lock
just audit                         # recent deploy history
just prune                         # remove unused images, containers, volumes
just test-infra                    # tear down + rebuild all stacks, verify health
```

### Database (`just db`)

```
just db shell [query]              # psql shell or run inline query
just db migrate                    # run pending migrations
just db types                      # regenerate DB types from schema
just db seed                       # run database seeds
just db make <name>                # create new migration file
just db reset                      # drop, recreate, migrate, seed
just db rollback                   # rollback last migration
just db backup                     # create gzipped dump
just db restore [timestamp]        # point-in-time recovery from WAL
just db restore-test [file]        # verify backup integrity
```

### Linting (`just lint`)

```
just lint format                   # run Prettier formatting
just lint types                    # run TypeScript type checking
```

### Testing (`just test`)

```
just test e2e [args]               # E2E tests in Docker (e.g., just test e2e --grep "book")
just test e2e-visual [args]        # E2E in headed browser (local, not Docker)
```

### Secrets (`just secrets`)

```
just secrets keygen                # generate new age key (one-time)
just secrets encrypt [target]      # encrypt .env → .env.enc
just secrets decrypt [target]      # decrypt .env.enc → .env
just secrets apply                 # decrypt + restart affected services
just secrets pubkey                # show current public key
```

### Deploy (`just deploy`)

```
just deploy push <services>        # deploy specific services (app, consumer, api, scheduler, gateway, media, pdf, status, geo)
just deploy pull                   # pull latest images
just deploy image-svelte <image>   # deploy specific svelte image
just deploy image-broker <image>   # deploy specific broker image
just deploy image-go <image>       # deploy specific go image
just deploy rollback [n] [services] # rollback N commits, redeploy
```

### SSH (`just ssh`)

```
just ssh run                       # interactive SSH into production server
just ssh run "<command>"           # run command remotely (e.g., just ssh run "docker ps")
```

### Zone (`just zone`)

```
just zone argentina                # extract Argentine boundaries + download tiles
```

### Observability (`just observability`)

```
just observability db shell        # psql shell to observability DB
just observability db migrate      # run observability migrations
just observability db make <name>  # create observability migration
just observability db rollback     # rollback last observability migration
just observability db reset        # drop + recreate observability DB
just observability lint format     # format observability code
just observability lint types      # type check observability code
```

## Remote Server Access

Use `just ssh run` proactively to diagnose production issues:

```bash
just ssh run "docker ps"
just ssh run "docker logs scheduler-ofelia-1 --tail 50"
just ssh run "cd /opt/habita && just health"
```

**Note:** streaming commands (like `just logs`) will hang over SSH. Use `--tail` with `docker logs` instead.

## Bash Conventions

- Never add `2>&1` to redirect stderr into stdout. Keep stderr separate so errors are visible.

## What NOT to Do

```bash
# WRONG — raw docker compose
docker compose -f infra/app/docker-compose.yml run --rm svelte pnpm run lint:format

# RIGHT
just lint format
```

```bash
# WRONG — npx/pnpm directly
npx tsc --noEmit

# RIGHT
just lint types
```

# Infrastructure Design

System design of the Habita infrastructure: architecture decisions, service configuration, deployment pipeline, and operational details.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Services Breakdown](#services-breakdown)
4. [Development vs Production](#development-vs-production)
5. [Running Locally](#running-locally)
6. [Secrets Management](#secrets-management)
7. [Backup Strategy](#backup-strategy)
8. [Scheduled Jobs](#scheduled-jobs)
9. [Observability](#observability)
10. [Deployment](#deployment)
11. [Common Operations](#common-operations)
12. [Troubleshooting](#troubleshooting)
13. [Security Considerations](#security-considerations)

---

## Architecture Overview

See [`../README.md`](../README.md) for the architecture diagram and service tables.

### Key Design Decisions

1. **Split docker-compose files**: Each concern (app, api, gateway, media, geo, scheduler) has its own `docker-compose.yml`. This allows independent scaling and updates.

2. **Shared network**: All services connect to an external `internal` network, allowing cross-compose communication.

3. **Label-based container discovery**: Cron jobs use Docker labels (`habita.role=app`) instead of hardcoded container names. This survives container restarts and scaling.

4. **Mirror environments**: Development and production configs are intentionally aligned. What works locally works in production.

---

## Directory Structure

See [`../README.md`](../README.md) for the current directory structure and project layout.

---

## Services Breakdown

### 1. Gateway (Caddy)

**Purpose**: Reverse proxy, TLS termination, routing

| Aspect | Development | Production |
|--------|-------------|------------|
| TLS | mkcert self-signed certs | Let's Encrypt auto-certs |
| Domain | `dev.habita.rent` | `habita.rent` |
| Security headers | None | HSTS, X-Frame-Options, etc. |
| Compression | None | gzip enabled |
| Logging | None | JSON access logs |

**Routing rules**:
- `/image/*` → `imgproxy:8080` (strip prefix)
- `/nominatim/*` → `nominatim:8090` (strip prefix)
- `/*` → `svelte:5174` (dev) or `svelte:3000` (prod)

### 2. App (SvelteKit)

**svelte** - Main application
- **Dev**: Builds from source with hot reload, port 5174
- **Prod**: Pre-built image (`niconiahi/habita:svelte-${TAG}`), port 3000
- Uses Playwright base image for PDF generation capabilities
- Health endpoint: `/health`

### 3. API (Go)

**Purpose**: Auxiliary Go service for specific workloads

- **Dev**: Builds from source, exposes port 8081
- **Prod**: Pre-built image (`niconiahi/habita:go-${TAG}`)
- Health endpoint: `/health`
- Currently used for middleware/processing tasks

### 4. Media (imgproxy)

**Purpose**: On-the-fly image transformation

| Config | Value |
|--------|-------|
| `IMGPROXY_BIND` | `:8080` |
| `IMGPROXY_USE_ETAG` | `true` |
| `IMGPROXY_AUTO_WEBP` | `true` |

**Dev-specific**:
- Runs as root (needs `update-ca-certificates`)
- Mounts custom CA cert for local TLS
- `extra_hosts` maps `dev.habita.rent` to host

**Prod-specific**:
- Runs as non-root user (1000:1000)
- No custom certs needed

### 5. Geo (Nominatim)

**Purpose**: Self-hosted geocoding/reverse geocoding

| Config | Value |
|--------|-------|
| Data | Argentina OSM extract |
| Port | 8090 |
| shm_size | 1gb (dev) / 2gb (prod) |
| Memory limit | 8G |

The initial import takes several hours. Data is persisted in a Docker volume.

**API endpoint**: `/nominatim/search?q=address&format=json`

### 6. Storage (PostgreSQL + Valkey + MinIO)

Database, cache, and object storage are grouped in the `storage/` directory as stateful services.

**db** - PostgreSQL with PostGIS
- Image: `postgis/postgis:17-3.4`
- Dev exposes port 5432 for direct access
- Prod has no exposed ports (security)
- Mounts `/backups` volume for backup storage

**kv** - Redis-compatible cache
- Image: `valkey/valkey:7.2`
- Dev exposes port 6379
- Used for session storage and caching

**object** - S3-compatible object storage
- Image: `rustfs/rustfs`
- Dev exposes ports 9000 (API) and 9001 (Console)
- Prod has no exposed ports
- Auto-creates `habita-files` bucket on startup

### 7. Broker (Redpanda)

**Purpose**: Kafka-compatible message broker

- Image: `redpandadata/redpanda:v24.3.1`
- Dev exposes port 9092 (Kafka) and 9644 (Admin API)
- Prod has no exposed ports
- Dev includes Redpanda Console (v2.8.1) on port 8090 for UI management
- Health check: `rpk cluster health`

### 8. PDF

**Purpose**: PDF generation service

- Built from `apps/pdf/Dockerfile`
- Dev exposes port 8082
- Prod has no exposed port (internal access only)
- Health endpoint: `/health`

### 9. Status (Gatus)

**Purpose**: Uptime and status monitoring

- Image: `twinproduction/gatus:v5.14.0`
- Configuration via `config.yaml`
- Lightweight: 128M memory, 0.25 CPU

### 10. Scheduler (Ofelia)

**Purpose**: Cron job orchestration

Uses [Ofelia](https://github.com/mcuadros/ofelia) to run scheduled tasks via `docker exec`.

**Jobs defined in `ofelia.ini`**:
- `create-escalation-jobs`: Every minute, creates escalation jobs
- `process-jobs`: Every minute, processes pending jobs
- `backup-db`: Daily at 3 AM, creates encrypted database backup

**Prod-only services**:
- `backup-worker`: Container with `pg_dump` and `age` encryption
- `backup-uploader`: rclone container for R2 uploads

---

## Development vs Production

### Intentional Differences

| Aspect | Development | Production | Reason |
|--------|-------------|------------|--------|
| **Exposed ports** | db:5432, kv:6379, geo:8090 | None | Debug access locally |
| **Image source** | Build from source | Pre-built images | Hot reload vs speed |
| **TLS** | mkcert self-signed | Let's Encrypt | No cert authority locally |
| **svelte start_period** | 60s | 30s | Dev compiles on startup |
| **nominatim shm_size** | 1gb | 2gb | Less memory needed locally |
| **imgproxy user** | root | 1000:1000 | Dev needs cert installation |
| **Security headers** | None | Full set | Dev flexibility |
| **Backups** | Local only | Encrypted + R2 upload | No cloud in dev |
| **Observability** | Self-hosted (ClickHouse + OTel Collector + UI) | Same self-hosted stack | Identical pipeline in both environments |

### Aligned Configurations

Everything else is intentionally identical:
- Health check intervals and timeouts
- Log rotation settings (50m/5 files)
- Resource limits structure
- Network topology
- Container labels
- Cron job paths and schedules

---

## Running Locally

### Prerequisites

1. **Docker** with Docker Compose v2
2. **mkcert** for local TLS certificates
3. **SOPS** with age for secrets decryption
4. **hosts file entry**: `127.0.0.1 dev.habita.rent`

### Initial Setup

```bash
# 1. Create the shared network
docker network create internal

# 2. Create the backups volume
docker volume create backups

# 3. Generate local TLS certificates
cd infra/gateway/certs
mkcert dev.habita.rent
mkcert -install  # Trust the CA

# 4. Copy CA cert for imgproxy
cp "$(mkcert -CAROOT)/rootCA.pem" ../media/certs/habita.pem

# 5. Decrypt secrets
just secrets decrypt
```

### Starting Services

```bash
# Start all services
just up

# Or start individual projects
dco storage up -d  # Database, cache, and object storage
dco app up -d      # SvelteKit
dco api up -d      # Go API
dco broker up -d   # Redpanda
dco gateway up -d  # Caddy
dco media up -d    # imgproxy
dco pdf up -d      # PDF generation
dco scheduler up -d
dco geo up -d      # Nominatim (takes hours on first run)
dco obs up -d      # Observability (optional)
dco status up -d   # Gatus (optional)
```

### Stopping Services

```bash
# Stop all
just down
```

### Useful Commands

```bash
# View logs
dco app svelte logs -f

# Access database
just db

# Access kv CLI
docker exec -it $(docker ps -qf "label=habita.role=cache") valkey-cli

# Rebuild svelte container
dco app svelte build
dco app svelte up -d

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## Secrets Management

See [`secrets.md`](secrets.md) for the full workflow (adding, changing, applying secrets).

**Why age over PGP?**
- Simpler key management (no key servers)
- Smaller, auditable codebase
- Single static key

**Key configuration** — `.sops.yaml` defines encryption rules per path:
```yaml
creation_rules:
  - path_regex: infra/\.env\.dev(\.enc)?$
    age: age1k9mtnlyx6383ukprf7s8ahc8hzs9ftpdnqa858nkhqpmc5y92s7qgkgzqc
  - path_regex: infra/\.env\.prod(\.enc)?$
    age: age1k9mtnlyx6383ukprf7s8ahc8hzs9ftpdnqa858nkhqpmc5y92s7qgkgzqc
  - path_regex: infra/scheduler/rclone\.conf(\.enc)?$
    age: age1k9mtnlyx6383ukprf7s8ahc8hzs9ftpdnqa858nkhqpmc5y92s7qgkgzqc
```

---

## Backup Strategy

See [`recovery/backups.md`](recovery/backups.md) for the full backup pipeline, restore procedures, and testing.

---

## Scheduled Jobs

All jobs are defined in `scheduler/ofelia.ini`.

| Job | Schedule | Purpose |
|-----|----------|---------|
| `create-escalation-jobs` | Every minute | Creates escalation jobs for overdue items |
| `process-jobs` | Every minute | Processes pending background jobs |
| `backup-db` | 3:00 AM daily | Database backup (encrypted in prod) |
| `backup-upload` | Hourly at :15 | Upload backups to R2 (prod only) |
| `backup-monitor` | 6:00 AM daily | Alert if no recent backup (prod only) |

### Cron Schedule Format

Ofelia uses a 6-field cron format (includes seconds):

```
┌─────────── second (0-59)
│ ┌───────── minute (0-59)
│ │ ┌─────── hour (0-23)
│ │ │ ┌───── day of month (1-31)
│ │ │ │ ┌─── month (1-12)
│ │ │ │ │ ┌─ day of week (0-6, Sun=0)
│ │ │ │ │ │
0 0 3 * * *   = 3:00:00 AM daily
0 * * * * *   = Every minute at :00
0 15 * * * *  = Every hour at :15
```

### Job Execution Pattern

Jobs use label-based container discovery:
```ini
command = docker exec $(docker ps -qf "label=habita.role=app" | head -1) bun run /app/src/lib/server/cron/script.ts
```

This pattern:
1. Finds container by label, not name
2. Uses `head -1` to pick one if scaled
3. Survives container restarts

### Adding New Jobs

1. Add script in `apps/web/src/lib/server/cron/`
2. Add job definition to `infra/scheduler/ofelia.ini`
3. Use consistent paths: `/app/src/lib/server/cron/your_script.ts`

---

## Observability

### Pipeline

All environments use the same self-hosted pipeline:

```
App → OTLP → OTel Collector → ClickHouse
```

Located in `infra/observability/`:
- `telemetry-db` — ClickHouse for traces, logs, and metrics storage
- `otel-collector` — OpenTelemetry Collector (contrib) with native ClickHouse exporter
- `observability-ui` — Custom SvelteKit app for viewing telemetry data

All services point to `http://otel-collector:4318` via `OTEL_EXPORTER_OTLP_ENDPOINT` in compose environment.

### Observability UI

Access at:
- Dev: `https://observability.dev.habita.rent`
- Prod: `https://observability.habita.rent`

Pages: log explorer, trace list, trace detail with span waterfall. Auth via cross-subdomain Better Auth session sharing.

### Instrumentation

The SvelteKit app uses OpenTelemetry auto-instrumentation:
- HTTP requests
- Database queries (pg)
- Redis operations (ioredis)

Server SDK initialized in `hooks.server.ts` via `init_telemetry()`. Browser telemetry proxied through `/api/otel/[...signal]`.

Key packages:
```json
"@opentelemetry/auto-instrumentations-node"
"@opentelemetry/exporter-trace-otlp-http"
"@opentelemetry/sdk-node"
```

---

## Deployment

### How Deploys Work

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Push to     │────▶│   GitHub     │────▶│   SSH to     │────▶│    just      │
│    main      │     │   Actions    │     │     VPS      │     │   deploy     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                            │
                     ┌──────┴──────┐
                     ▼             ▼
              ┌────────────┐ ┌────────────┐
              │   Build    │ │   Build    │
              │   Svelte   │ │    Go      │
              │   Image    │ │   Image    │
              └────────────┘ └────────────┘
```

### Path-Based Triggers

The deploy workflow only triggers for relevant changes:

| Path | Triggers |
|------|----------|
| `apps/web/**` | Svelte build + app deploy |
| `apps/go/**` | Go build + api deploy |
| `infra/scheduler/**` | scheduler deploy |
| `infra/gateway/**` | gateway deploy |
| `infra/media/**` | media deploy |
| `infra/.env.prod.enc` | secrets deploy |

### Image Building

Images are built from:
- `apps/web/Dockerfile` → `niconiahi/habita:svelte-${TAG}`
- `apps/go/Dockerfile` → `niconiahi/habita:go-${TAG}`

Multi-stage builds:
1. `deps`: Install dependencies
2. `build`: Compile application
3. `prod`: Minimal runtime image

### Deploy Safety Features

#### 1. Deploy Locking
Prevents concurrent deploys:
```bash
exec 200>/tmp/habita-deploy.lock
flock -n 200 || { echo "Deploy already in progress"; exit 1; }
```

#### 2. Health Check Verification
After deploy, waits 10s then checks for unhealthy containers:
```bash
unhealthy=$(docker ps --filter "health=unhealthy" --format "{{.Names}}")
if [[ -n "$unhealthy" ]]; then
  exit 1  # Triggers failure notification
fi
```

#### 3. Notifications
If `DEPLOY_WEBHOOK_URL` is set, sends Discord/Slack notifications:
- ✅ Success: "Deploy succeeded on habita.rent"
- ❌ Failure: "Deploy failed on habita.rent"

### Manual Deployment

```bash
# Deploy specific services
just --set env production deploy app api

# Deploy all services
just --set env production deploy app api scheduler gateway media
```

### Rollback

See [`recovery/deploy_rollback.md`](recovery/deploy_rollback.md) for the full rollback guide covering application code, environment variables, database migrations, and infrastructure changes.

---

## Common Operations

Run `just --list` for all available commands. See the [CLI skill](/.claude/skills/cli/SKILL.md) for the full reference of `just` and `dco` commands.

---

## Troubleshooting

See [`../README.md`](../README.md#troubleshooting) for basic issues (network, logs, health checks). Below are service-specific problems.

### "Deploy already in progress"

Another deploy is running or crashed while holding the lock.

```bash
ssh vps "ls -la /tmp/habita-deploy.lock"
# If no deploy is running, remove the lock
ssh vps "rm /tmp/habita-deploy.lock"
```

### imgproxy SSL Errors (Dev)

If imgproxy cannot fetch from `dev.habita.rent`:
1. Verify cert is mounted: `docker exec <container> ls /usr/local/share/ca-certificates/`
2. Check CA was updated: `docker logs <container>` should show `update-ca-certificates`
3. Verify extra_hosts: `docker exec <container> cat /etc/hosts`

### Nominatim Not Responding

1. Check if import is complete: `docker logs <container>` (look for "import complete")
2. Verify port: Health check uses port 8090
3. Check memory: Nominatim needs significant RAM during queries

### Cron Jobs Not Running

1. Verify ofelia is running: `docker ps -f name=ofelia`
2. Check ofelia logs: `docker logs <ofelia-container>`
3. Test label discovery: `docker exec $(docker ps -qf "label=habita.role=app" | head -1) echo "Container found"`

### Backup Upload Not Working

```bash
# Check if backup marker exists
docker exec $(docker ps -qf "label=habita.role=backup-uploader" | head -1) ls -la /backups/

# Test rclone manually
docker exec $(docker ps -qf "label=habita.role=backup-uploader" | head -1) \
  rclone ls r2:habita-backups --config /config/rclone/rclone.conf
```

### Secrets Decryption Fails

```bash
ls ~/.config/sops/age/keys.txt
just secrets pubkey
# Should match: age1k9mtnlyx6383ukprf7s8ahc8hzs9ftpdnqa858nkhqpmc5y92s7qgkgzqc
```

---

## Security Considerations

### Network Isolation

- All services on private `internal` network
- Only Caddy exposes ports 80/443
- Database and cache have no external ports in production

### Non-root Containers

Production containers run as non-root users:
- svelte: `appuser` (10001)
- go: `gopher` (10001)
- imgproxy: `1000:1000`
- backup-worker: `backup` (10001)

### Secrets

- All secrets encrypted with SOPS/age
- `.env` files are gitignored
- Backup encryption uses same age key
- R2 credentials stored encrypted

### TLS

- Production: Let's Encrypt with auto-renewal
- Development: mkcert (local CA, not trusted globally)

### Security Headers (Production)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

For port mappings, container labels, and resource limits see [`../README.md`](../README.md). For all available commands run `just --list`.

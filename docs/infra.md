# Habita Infrastructure Documentation

> **Knowledge Transfer Document**
>
> This document explains how the entire Habita infrastructure works. It's written as if handing off to a new engineer who needs to understand, operate, and evolve this system.

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
14. [Justfile Command Reference](#justfile-command-reference)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GATEWAY (Caddy)                                      │
│  • TLS termination (Let's Encrypt in prod, mkcert in dev)                   │
│  • Routes: /image/* → imgproxy, /nominatim/* → nominatim, /* → svelte       │
│  • Security headers (prod only)                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              ┌──────────┐   ┌──────────┐   ┌──────────┐
              │  svelte  │   │ imgproxy │   │nominatim │
              │ (app)    │   │ (media)  │   │  (geo)   │
              └──────────┘   └──────────┘   └──────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
    ┌──────────┐        ┌──────────┐
    │ postgres │        │    kv    │
    │   (db)   │        │ (cache)  │
    └──────────┘        └──────────┘
          │
          ▼
    ┌──────────────────────────────────────┐
    │           SCHEDULER (ofelia)          │
    │  • Cron jobs for escalations          │
    │  • Backup orchestration (prod only)   │
    └──────────────────────────────────────┘
          │ (prod only)
          ▼
    ┌──────────┐        ┌──────────┐
    │ backup-  │───────▶│ backup-  │───────▶ Cloudflare R2
    │ worker   │        │ uploader │
    └──────────┘        └──────────┘
```

### Key Design Decisions

1. **Split docker-compose files**: Each concern (app, api, gateway, media, geo, scheduler) has its own `docker-compose.yml`. This allows independent scaling and updates.

2. **Shared network**: All services connect to an external `internal` network, allowing cross-compose communication.

3. **Label-based container discovery**: Cron jobs use Docker labels (`habita.role=app`) instead of hardcoded container names. This survives container restarts and scaling.

4. **Mirror environments**: Development and production configs are intentionally aligned. What works locally works in production.

---

## Directory Structure

```
infra/
├── development/
│   ├── .env                    # Decrypted secrets (gitignored)
│   ├── .env.enc                # Encrypted secrets (committed)
│   ├── api/
│   │   └── docker-compose.yml  # Go API service
│   ├── app/
│   │   └── docker-compose.yml  # SvelteKit + Postgres + Valkey
│   ├── gateway/
│   │   ├── Caddyfile           # Routing config
│   │   ├── docker-compose.yml
│   │   └── certs/              # mkcert certificates
│   ├── geo/
│   │   └── docker-compose.yml  # Nominatim geocoding
│   ├── media/
│   │   ├── docker-compose.yml  # imgproxy
│   │   └── certs/              # CA cert for local TLS
│   ├── scheduler/
│   │   ├── docker-compose.yml  # Ofelia cron scheduler
│   │   └── ofelia.ini          # Cron job definitions
│   └── observability/          # SigNoz stack (dev only)
│       ├── docker-compose.yml
│       ├── otel-collector-config.yaml
│       └── ...
│
├── production/
│   ├── .env                    # Decrypted secrets
│   ├── .env.enc                # Encrypted secrets
│   ├── api/
│   │   └── docker-compose.yml
│   ├── app/
│   │   └── docker-compose.yml
│   ├── gateway/
│   │   ├── Caddyfile
│   │   └── docker-compose.yml
│   ├── geo/
│   │   └── docker-compose.yml
│   ├── media/
│   │   └── docker-compose.yml
│   └── scheduler/
│       ├── docker-compose.yml
│       ├── ofelia.ini
│       ├── Dockerfile.backup   # Custom backup container
│       ├── rclone.conf         # R2 credentials (decrypted)
│       └── rclone.conf.enc     # R2 credentials (encrypted)
```

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

### 2. App (SvelteKit + Postgres + Valkey)

**svelte** - Main application
- **Dev**: Builds from source with hot reload, port 5174
- **Prod**: Pre-built image (`niconiahi/habita:svelte-${TAG}`), port 3000
- Uses Playwright base image for PDF generation capabilities
- Health endpoint: `/health`

**db** - PostgreSQL with PostGIS
- Image: `postgis/postgis:17-3.4`
- Dev exposes port 5432 for direct access
- Prod has no exposed ports (security)
- Mounts `/backups` volume for backup storage

**kv** - Redis-compatible cache
- Image: `valkey/valkey:7.2`
- Dev exposes port 6379
- Used for session storage and caching

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

### 6. Scheduler (Ofelia)

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
| **Observability** | Full SigNoz stack | Axiom (external) | Self-hosted for dev |

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
cd infra/development/gateway/certs
mkcert dev.habita.rent
mkcert -install  # Trust the CA

# 4. Copy CA cert for imgproxy
cp "$(mkcert -CAROOT)/rootCA.pem" ../media/certs/habita.pem

# 5. Decrypt secrets
cd infra/development
sops -d .env.enc > .env
```

### Starting Services

```bash
# Start all services (order matters for dependencies)
cd infra/development

# 1. Storage stack (db, kv)
docker compose -f app/docker-compose.yml up -d

# 2. Gateway
docker compose -f gateway/docker-compose.yml up -d

# 3. Media (imgproxy)
docker compose -f media/docker-compose.yml up -d

# 4. Geo (nominatim) - takes hours on first run
docker compose -f geo/docker-compose.yml up -d

# 5. API (go)
docker compose -f api/docker-compose.yml up -d

# 6. Scheduler
docker compose -f scheduler/docker-compose.yml up -d

# 7. Observability (optional)
docker compose -f observability/docker-compose.yml up -d
```

### Stopping Services

```bash
# Stop all
cd infra/development
docker compose -f scheduler/docker-compose.yml down
docker compose -f api/docker-compose.yml down
docker compose -f geo/docker-compose.yml down
docker compose -f media/docker-compose.yml down
docker compose -f gateway/docker-compose.yml down
docker compose -f app/docker-compose.yml down
```

### Useful Commands

```bash
# View logs
docker compose -f app/docker-compose.yml logs -f svelte

# Access database
docker exec -it $(docker ps -qf "label=habita.role=database") psql -U $POSTGRES_USER -d $POSTGRES_DB

# Access kv CLI
docker exec -it $(docker ps -qf "label=habita.role=cache") valkey-cli

# Rebuild svelte container
docker compose -f app/docker-compose.yml build svelte
docker compose -f app/docker-compose.yml up -d svelte

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## Secrets Management

### Tool: SOPS + age

We use [SOPS](https://github.com/getsops/sops) with [age](https://github.com/FiloSottile/age) encryption.

**Why age over PGP?**
- Simpler key management (no key servers)
- Smaller, auditable codebase
- Single static key

### Key Configuration

`.sops.yaml` defines encryption rules:
```yaml
creation_rules:
  - path_regex: infra/development/\.env(\.enc)?$
    age: age1k9mtnlyx6383ukprf7s8ahc8hzs9ftpdnqa858nkhqpmc5y92s7qgkgzqc
  - path_regex: infra/production/\.env(\.enc)?$
    age: age1k9mtnlyx6383ukprf7s8ahc8hzs9ftpdnqa858nkhqpmc5y92s7qgkgzqc
  - path_regex: infra/production/scheduler/rclone\.conf(\.enc)?$
    age: age1k9mtnlyx6383ukprf7s8ahc8hzs9ftpdnqa858nkhqpmc5y92s7qgkgzqc
```

### Common Operations

```bash
# Decrypt a file
sops -d .env.enc > .env

# Edit encrypted file in-place
sops .env.enc

# Encrypt a new file
sops -e .env > .env.enc

# Rotate to a new key (add new key, re-encrypt, remove old)
sops updatekeys .env.enc
```

### Where to store the private key

The age private key should be in:
- `~/.config/sops/age/keys.txt` (standard location)
- Or set `SOPS_AGE_KEY_FILE` environment variable

**NEVER commit the private key.** Share it securely with team members.

### Adding a New Secret

1. Edit the plaintext file:
   ```bash
   just --set env production secrets edit
   ```
2. Add your variable: `NEW_SECRET=value`
3. Save and close - sops auto-encrypts
4. Commit the `.env.enc` file (NOT the `.env` file!)
5. Deploy with `secrets` service:
   ```bash
   just --set env production deploy secrets
   ```

---

## Backup Strategy

### Development

Simple unencrypted daily backup:
```ini
[job-local "backup-db"]
schedule = 0 0 3 * * *
command = docker exec $(docker ps -qf "label=habita.role=database") \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > \
  /backups/habita_$(date +%Y%m%d_%H%M%S).sql.gz && \
  find /backups -name "*.sql.gz" -mtime +7 -delete'
```

### Production

Three-stage encrypted backup pipeline:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. backup-db   │────▶│  2. backup-     │────▶│  3. backup-     │
│  (3:00 AM)      │     │     upload      │     │     monitor     │
│                 │     │  (hourly :15)   │     │  (6:00 AM)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   pg_dump → gzip         rclone sync to R2      Alert if no
   → age encrypt          (if marker exists)     recent backup
   → save + marker
```

**Encryption**: Uses `age` with the same public key from `.sops.yaml`

**Marker file**: `.backup-ready` signals that a backup is complete and ready for upload. Removed after successful upload.

**Retention**: 7 days locally, configurable in R2 lifecycle rules

### Restore Procedure

```bash
# 1. Download from R2 (if needed)
rclone copy r2:habita-backup/postgres/habita_20240115_030000.sql.gz.age ./

# 2. Decrypt
age -d -i ~/.config/sops/age/keys.txt habita_20240115_030000.sql.gz.age > backup.sql.gz

# 3. Decompress
gunzip backup.sql.gz

# 4. Restore
psql -U $POSTGRES_USER -d $POSTGRES_DB < backup.sql
```

### Restore Testing

Run monthly to verify backups are valid:

```bash
just --set env production restore-test
```

This will:
1. Find the latest encrypted backup
2. Create a temporary test database
3. Decrypt and restore the backup
4. Run sanity checks (table counts)
5. Clean up the test database

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
2. Add job definition to both `infra/development/scheduler/ofelia.ini` and `infra/production/scheduler/ofelia.ini`
3. Use consistent paths: `/app/src/lib/server/cron/your_script.ts`

---

## Observability

### Development: Self-hosted SigNoz

Located in `infra/development/observability/`:
- ClickHouse for storage
- OpenTelemetry Collector
- Prometheus for metrics
- AlertManager for alerts

Access at: `http://localhost:3301`

### Production: Axiom

Traces and logs are sent to [Axiom](https://axiom.co):

```yaml
OTEL_EXPORTER_OTLP_ENDPOINT: https://api.axiom.co
OTEL_EXPORTER_OTLP_HEADERS: Authorization=Bearer $AXIOM_TOKEN,X-Axiom-Dataset=$AXIOM_DATASET
```

### Instrumentation

The SvelteKit app uses OpenTelemetry auto-instrumentation:
- HTTP requests
- Database queries (pg)
- Redis operations (ioredis)

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
| `infra/production/scheduler/**` | scheduler deploy |
| `infra/production/gateway/**` | gateway deploy |
| `infra/production/media/**` | media deploy |
| `infra/production/.env.enc` | secrets deploy |

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

If something goes wrong:

```bash
# Rollback 1 commit and redeploy app + api
just --set env production rollback 1 app api

# Rollback 3 commits
just --set env production rollback 3 app api scheduler

# After reviewing, either commit or abort:
git commit -m "Rollback: revert N commits"
# OR
git revert --abort
```

### Zero-downtime Deployments

Caddy handles graceful connection draining. For true zero-downtime:
1. Scale to 2 replicas
2. Rolling update
3. Scale back to 1

---

## Common Operations

### Database Migrations

```bash
# Development
docker exec -it $(docker ps -qf "label=habita.role=app") bun run db:migrate

# Production
docker exec $(docker ps -qf "label=habita.role=app") bun run db:migrate
```

### Viewing Logs

```bash
# Real-time logs
docker compose -f app/docker-compose.yml logs -f svelte

# Last 100 lines
docker compose -f app/docker-compose.yml logs --tail 100 svelte

# All services
docker compose -f app/docker-compose.yml logs -f
```

### Manual Backup

```bash
# Development
docker exec $(docker ps -qf "label=habita.role=database") \
  pg_dump -U $POSTGRES_USER -d $POSTGRES_DB | gzip > backup.sql.gz

# Production (encrypted)
docker exec $(docker ps -qf "label=habita.role=backup-worker") \
  sh -c 'pg_dump -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip | age -r "$AGE_PUBLIC_KEY"' > backup.sql.gz.age
```

### Clearing Cache

```bash
docker exec $(docker ps -qf "label=habita.role=cache") valkey-cli FLUSHALL
```

### Rebuilding Nominatim

If you need fresh OSM data:
```bash
docker compose -f geo/docker-compose.yml down -v  # Removes volume!
docker compose -f geo/docker-compose.yml up -d
# Wait several hours for import
```

---

## Troubleshooting

### "Deploy already in progress"

Another deploy is running or crashed while holding the lock.

```bash
# Check for stale lock
ssh vps "ls -la /tmp/habita-deploy.lock"

# If no deploy is running, remove the lock
ssh vps "rm /tmp/habita-deploy.lock"
```

### Container not found by label

The container might not be running or doesn't have the label.

```bash
# List containers with habita labels
docker ps --filter "label=habita.role" --format "table {{.Names}}\t{{.Label \"habita.role\"}}"

# If missing, check compose file has labels and restart:
just --set env production restart app
```

### Service Won't Start

1. Check logs: `docker compose logs <service>`
2. Check health: `docker ps` (look for "unhealthy")
3. Verify network: `docker network inspect internal`
4. Check resources: `docker stats`

### Database Connection Issues

```bash
# Test connectivity from svelte container
docker exec $(docker ps -qf "label=habita.role=app") \
  sh -c 'nc -zv db 5432'

# Check pg_isready
docker exec $(docker ps -qf "label=habita.role=database") \
  pg_isready -U $POSTGRES_USER
```

### imgproxy SSL Errors (Dev)

If imgproxy can't fetch from `dev.habita.rent`:
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
3. Test command manually:
   ```bash
   docker exec $(docker ps -qf "label=habita.role=app" | head -1) echo "Container found"
   ```

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
# Check key exists
ls ~/.config/sops/age/keys.txt

# Verify key matches .sops.yaml
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

## Quick Reference

### Ports

| Service | Dev Port | Prod Port | Internal Port |
|---------|----------|-----------|---------------|
| Caddy | 80, 443 | 80, 443 | - |
| SvelteKit | 5174 | - | 5174 (dev) / 3000 (prod) |
| PostgreSQL | 5432 | - | 5432 |
| Valkey | 6379 | - | 6379 |
| Nominatim | 8090 | - | 8090 |
| imgproxy | - | - | 8080 |
| Go API | 8081 | - | 8081 |

### Container Labels

| Label | Container |
|-------|-----------|
| `habita.role=app` | svelte |
| `habita.role=database` | db |
| `habita.role=cache` | kv |
| `habita.role=scheduler` | ofelia |
| `habita.role=backup-worker` | backup-worker |
| `habita.role=backup-uploader` | backup-uploader |

### Resource Limits Summary

| Service | Memory Limit | CPU Limit |
|---------|--------------|-----------|
| svelte | 1G (dev) / 2G (prod) | 2.0 |
| db | 512M (dev) / 1G (prod) | 1.0 / 2.0 |
| kv | 256M / 512M | 0.5 |
| nominatim | 8G | 4.0 |
| imgproxy | 256M / 512M | 1.0 / 2.0 |
| caddy | 128M / 256M | 0.5 / 1.0 |
| go | 256M / 512M | 1.0 |
| ofelia | 128M | 0.25 |

---

## Justfile Command Reference

All infrastructure operations are managed via [Just](https://github.com/casey/just) (a modern make alternative).

### Quick Reference Card

| Command | Description |
|---------|-------------|
| `just up` | Start all services |
| `just down` | Stop all services |
| `just status` | Show service status |
| `just logs <svc>` | View logs (app, api, scheduler, gateway, media) |
| `just restart <svc>` | Restart a service |
| `just db` | PostgreSQL shell |
| `just backup` | Manual backup (local, unencrypted) |
| `just restore-test` | Test backup restore |
| `just deploy <svcs>` | Deploy services (CI/CD) |
| `just rollback <n> <svcs>` | Rollback n commits |
| `just secrets decrypt` | Decrypt .env files |
| `just secrets encrypt` | Encrypt .env files |
| `just secrets edit` | Edit secrets in $EDITOR |
| `just secrets keygen` | Generate new age key |
| `just secrets pubkey` | View public key |
| `just prune` | Clean Docker resources |
| `just geo` | Start Nominatim (heavy) |
| `just geo-down` | Stop Nominatim |

### Environment Switching

All commands default to **development**. For production:

```bash
just --set env production <command>
```

Examples:
```bash
# Production deploy
just --set env production deploy app api

# Production logs
just --set env production logs app

# Production restart
just --set env production restart scheduler
```

### Full Command List

Run `just --list` for all available commands with descriptions.

---

## Contact & Resources

- **Repository**: This repo
- **Hosting**: Your VPS provider
- **DNS**: Cloudflare
- **Object Storage**: Cloudflare R2
- **Monitoring**: Axiom (prod), SigNoz (dev)
- **Docker Registry**: Docker Hub (`niconiahi/habita`)

---

*Last updated: January 2026*

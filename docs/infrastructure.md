# Habita Infrastructure Guide

> Knowledge transfer documentation for operating and maintaining the Habita infrastructure.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Services](#services)
3. [Deployment](#deployment)
4. [Backup System](#backup-system)
5. [Secrets Management](#secrets-management)
6. [Scheduled Jobs](#scheduled-jobs)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Troubleshooting](#troubleshooting)
9. [Command Reference](#command-reference)

---

## Architecture Overview

### System Diagram

```
                                    ┌─────────────────────────────────────────┐
                                    │              INTERNET                   │
                                    └─────────────────┬───────────────────────┘
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  VPS (Production)                                                                       │
│                                                                                         │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐       │
│   │   Caddy     │      │   Svelte    │      │     Go      │      │  imgproxy   │       │
│   │  (gateway)  │─────▶│    (app)    │◀────▶│    (api)    │      │   (media)   │       │
│   │  :80/:443   │      │   :3000     │      │   :8080     │      │   :8081     │       │
│   └─────────────┘      └──────┬──────┘      └─────────────┘      └─────────────┘       │
│          │                    │                                                         │
│          │             ┌──────┴──────┐                                                  │
│          │             ▼             ▼                                                  │
│          │      ┌───────────┐  ┌───────────┐                                           │
│          │      │ PostgreSQL│  │   Valkey  │                                           │
│          │      │   (db)    │  │  (cache)  │                                           │
│          │      │   :5432   │  │   :6379   │                                           │
│          │      └─────┬─────┘  └───────────┘                                           │
│          │            │                                                                 │
│   ┌──────┴────────────┴─────────────────────────────────────────┐                      │
│   │                    Scheduler Stack                           │                      │
│   │  ┌─────────┐   ┌───────────────┐   ┌──────────────────┐     │                      │
│   │  │ Ofelia  │   │ backup-worker │   │  backup-uploader │     │                      │
│   │  │ (cron)  │   │  (pg_dump+age)│   │     (rclone)     │     │                      │
│   │  └─────────┘   └───────────────┘   └────────┬─────────┘     │                      │
│   └─────────────────────────────────────────────┼───────────────┘                      │
│                                                 │                                       │
└─────────────────────────────────────────────────┼───────────────────────────────────────┘
                                                  │
                                                  ▼
                                         ┌───────────────┐
                                         │ Cloudflare R2 │
                                         │   (backups)   │
                                         └───────────────┘
```

### Key Principles

| Principle | Implementation |
|-----------|----------------|
| **Service isolation** | Each service runs in its own Docker Compose project |
| **Dynamic discovery** | Containers use labels (`habita.role=*`) instead of hardcoded names |
| **Encrypted secrets** | All secrets encrypted with sops + age |
| **Encrypted backups** | Database backups encrypted with age before upload |
| **Health checks** | All critical services have health checks |
| **Resource limits** | Every container has memory limits |

### Network Architecture

All services communicate over a shared Docker network called `internal`:

```bash
docker network create internal
```

Services are NOT exposed to the internet directly - only Caddy (gateway) has public ports.

---

## Services

### App Stack (`docker compose -p app`)

The core application services.

| Service | Image | Role | Memory |
|---------|-------|------|--------|
| `db` | `postgis/postgis:17-3.4` | PostgreSQL + PostGIS | 1G |
| `valkey` | `valkey/valkey:7` | Redis-compatible cache | 512M |
| `svelte` | `niconiahi/habita:svelte-*` | SvelteKit application | 2G |

**Labels:**
- `habita.role=database`
- `habita.role=cache`
- `habita.role=app`

**Volumes:**
- `db` - PostgreSQL data
- `kv` - Valkey data
- `backups` - Database backup files

### API Stack (`docker compose -p api`)

Go middleware for specific operations.

| Service | Image | Role | Memory |
|---------|-------|------|--------|
| `go` | `niconiahi/habita:go-latest` | API middleware | 512M |

**Health check:** `GET /health`

### Gateway Stack (`docker compose -p gateway`)

Caddy reverse proxy handling SSL and routing.

| Service | Image | Role | Memory |
|---------|-------|------|--------|
| `caddy` | `caddy:2-alpine` | Reverse proxy, SSL | 256M |

**Routing rules:**
- `/image/*` → imgproxy (media)
- `/nominatim/*` → Nominatim (geo, if running)
- `/*` → SvelteKit app

**SSL:** Automatic Let's Encrypt certificates in production.

### Media Stack (`docker compose -p media`)

Image processing and optimization.

| Service | Image | Role | Memory |
|---------|-------|------|--------|
| `imgproxy` | `darthsim/imgproxy:latest` | Image resizing, WebP | 512M |

### Scheduler Stack (`docker compose -p scheduler`)

Cron jobs and backup management.

| Service | Image | Role | Memory |
|---------|-------|------|--------|
| `ofelia` | `mcuadros/ofelia:latest` | Job scheduler | 128M |
| `backup-worker` | Custom (Dockerfile.backup) | pg_dump + age encryption | 256M |
| `backup-uploader` | `rclone/rclone:latest` | R2 sync | 128M |

**Labels:**
- `habita.role=scheduler`
- `habita.role=backup-worker`
- `habita.role=backup-uploader`

### Geo Stack (`docker compose -p geo`) - Optional

Geocoding service. Resource-intensive, only run if needed.

| Service | Image | Role | Memory |
|---------|-------|------|--------|
| `nominatim` | `mediagis/nominatim:4.4` | Address lookup | 8G |

**Start:** `just geo`
**Stop:** `just geo-down`

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

### Manual Deploy

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

---

## Backup System

### Backup Flow

```
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────┐
│ 3:00 AM │───▶│   pg_dump   │───▶│    gzip     │───▶│ age encrypt │───▶│  .age   │
│  daily  │    │             │    │             │    │             │    │  file   │
└─────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └────┬────┘
                                                                              │
                                                                              ▼
                                                                     ┌───────────────┐
                                                                     │ .backup-ready │
                                                                     │    marker     │
                                                                     └───────┬───────┘
                                                                              │
┌─────────┐    ┌─────────────┐    ┌─────────────┐                             │
│  Hourly │───▶│ Check for   │───▶│ rclone sync │◀────────────────────────────┘
│  :15    │    │   marker    │    │   to R2     │
└─────────┘    └─────────────┘    └─────────────┘
```

### Timing Race Solution

**Problem:** If backup at 3:00 AM takes >30 min, upload at 3:30 AM gets incomplete file.

**Solution:** Completion markers.

1. Backup job creates file, then writes `.backup-ready` marker
2. Upload job runs hourly, only syncs if marker exists
3. After successful upload, marker is removed

### Backup Files

| Type | Location | Retention |
|------|----------|-----------|
| Local | `/backups/*.sql.gz.age` | 7 days |
| Remote | `r2:habita-backups/postgres/` | Configure in R2 |

### Encryption

Backups are encrypted with age using the public key from `.sops.yaml`:

```
age1k9mtnlyx6383ukprf7s8ahc8hzs9ftpdnqa858nkhqpmc5y92s7qgkgzqc
```

**Decrypt a backup manually:**
```bash
age -d -i ~/.config/sops/age/keys.txt backup.sql.gz.age | gunzip > backup.sql
```

### Restore Testing

Monthly restore verification (run manually):

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

## Secrets Management

### Tools

- **sops** - Encrypts/decrypts files
- **age** - Encryption backend (simpler than GPG)

### Encrypted Files

| File | Purpose |
|------|---------|
| `infra/production/.env.enc` | Production environment variables |
| `infra/development/.env.enc` | Development environment variables |
| `infra/production/scheduler/rclone.conf.enc` | R2 credentials |

### Key Location

```
~/.config/sops/age/keys.txt
```

**CRITICAL:** This file contains the private key. Back it up securely. Without it, you cannot decrypt secrets.

### Common Operations

```bash
# Generate new key (one-time)
just secrets-keygen

# View public key
just secrets-pubkey

# Decrypt secrets (after git clone or on server)
just --set env production secrets-decrypt

# Encrypt after editing
just --set env production secrets-encrypt

# Edit secrets directly (opens in $EDITOR)
just --set env production secrets-edit
```

### Adding a New Secret

1. Edit the plaintext file:
   ```bash
   just --set env production secrets-edit
   ```
2. Add your variable: `NEW_SECRET=value`
3. Save and close - sops auto-encrypts
4. Commit the `.env.enc` file (NOT the `.env` file!)
5. Deploy with `secrets` service:
   ```bash
   just --set env production deploy secrets
   ```

---

## Scheduled Jobs

All jobs use **Ofelia** (Docker-native cron) with dynamic container discovery.

### Job Configuration

Location: `infra/production/scheduler/ofelia.ini`

### Current Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `create-escalation-jobs` | Every minute | Create escalation tasks |
| `process-jobs` | Every minute | Process background jobs |
| `backup-db` | 3:00 AM daily | Database backup with encryption |
| `backup-upload` | :15 hourly | Sync backups to R2 |
| `backup-monitor` | 6:00 AM daily | Alert if no recent backup |

### Cron Schedule Format

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

### Dynamic Container Discovery

Jobs find containers by label instead of hardcoded names:

```bash
# Old (fragile):
container = app-svelte-1

# New (robust):
docker exec $(docker ps -qf "label=habita.role=app" | head -1) ...
```

This works even if containers are scaled or renamed.

---

## Monitoring & Alerts

### Deploy Notifications

Set `DEPLOY_WEBHOOK_URL` in the VPS environment to receive notifications:

```bash
# Discord webhook example
export DEPLOY_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

### Backup Monitoring

The `backup-monitor` job runs at 6:00 AM and exits with error if no backup exists from the last 24 hours. Check Ofelia logs to see failures:

```bash
just --set env production logs scheduler
```

### Health Checks

All critical services have Docker health checks:

```bash
# View health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Find unhealthy containers
docker ps --filter "health=unhealthy"
```

### External Monitoring (Recommended)

Set up an external uptime monitor (UptimeRobot, Checkly, etc.) for:
- `https://habita.rent` (main site)
- `https://habita.rent/api/health` (if applicable)

---

## Troubleshooting

### Common Issues

#### "Deploy already in progress"

Another deploy is running or crashed while holding the lock.

```bash
# Check for stale lock
ssh vps "ls -la /tmp/habita-deploy.lock"

# If no deploy is running, remove the lock
ssh vps "rm /tmp/habita-deploy.lock"
```

#### Container not found by label

The container might not be running or doesn't have the label.

```bash
# List containers with habita labels
docker ps --filter "label=habita.role" --format "table {{.Names}}\t{{.Label \"habita.role\"}}"

# If missing, check compose file has labels and restart:
just --set env production restart app
```

#### Backup upload not working

```bash
# Check if backup marker exists
docker exec $(docker ps -qf "label=habita.role=backup-uploader" | head -1) ls -la /backups/

# Test rclone manually
docker exec $(docker ps -qf "label=habita.role=backup-uploader" | head -1) \
  rclone ls r2:habita-backups --config /config/rclone/rclone.conf
```

#### Secrets decryption fails

```bash
# Check key exists
ls ~/.config/sops/age/keys.txt

# Verify key matches .sops.yaml
just secrets-pubkey
# Should match: age1k9mtnlyx6383ukprf7s8ahc8hzs9ftpdnqa858nkhqpmc5y92s7qgkgzqc
```

#### Database connection issues

```bash
# Check db container health
docker inspect $(docker ps -qf "label=habita.role=database" | head -1) --format='{{.State.Health.Status}}'

# View db logs
just --set env production logs app
# Look for PostgreSQL logs

# Connect to db shell
just --set env production db
```

### Viewing Logs

```bash
# Specific service
just --set env production logs app
just --set env production logs scheduler
just --set env production logs gateway

# All containers
docker logs -f <container_id>

# Ofelia job logs (cron)
docker logs $(docker ps -qf "label=habita.role=scheduler" | head -1) 2>&1 | grep "backup-db"
```

### Restarting Services

```bash
# Single service
just --set env production restart app
just --set env production restart scheduler

# Full restart
just --set env production down
just --set env production up
```

---

## Command Reference

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
| `just secrets-decrypt` | Decrypt .env files |
| `just secrets-encrypt` | Encrypt .env files |
| `just secrets-edit` | Edit secrets in $EDITOR |
| `just prune` | Clean Docker resources |
| `just geo` | Start Nominatim (heavy) |
| `just geo-down` | Stop Nominatim |

### Environment Switching

All commands default to development. For production:

```bash
just --set env production <command>
```

### Full Command Details

See `just --list` for all available commands with descriptions.

---

## Appendix: File Locations

```
habita/
├── Justfile                          # All infrastructure commands
├── .sops.yaml                        # Encryption configuration
├── .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD pipeline
├── infra/
│   ├── development/
│   │   ├── .env                      # Dev secrets (gitignored)
│   │   ├── .env.enc                  # Dev secrets (encrypted)
│   │   ├── app/docker-compose.yml
│   │   ├── api/docker-compose.yml
│   │   ├── gateway/
│   │   ├── media/
│   │   ├── scheduler/
│   │   │   ├── docker-compose.yml
│   │   │   └── ofelia.ini
│   │   └── geo/
│   └── production/
│       ├── .env                      # Prod secrets (gitignored)
│       ├── .env.enc                  # Prod secrets (encrypted)
│       ├── app/docker-compose.yml
│       ├── api/docker-compose.yml
│       ├── gateway/
│       ├── media/
│       ├── scheduler/
│       │   ├── docker-compose.yml
│       │   ├── Dockerfile.backup     # Custom backup image
│       │   ├── ofelia.ini
│       │   ├── rclone.conf           # R2 config (gitignored)
│       │   └── rclone.conf.enc       # R2 config (encrypted)
│       └── geo/
└── docs/
    └── infrastructure.md             # This file
```

---

*Last updated: January 2026*

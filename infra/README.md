# Habita Infrastructure

This document describes the Docker infrastructure architecture for Habita.

## Quick Start

```bash
# Start all services (development)
just up

# Or use dco for individual projects
dco storage up -d  # Database, cache, and object storage (stateful)
dco app up -d      # SvelteKit and consumer (stateless)
dco api up -d      # Go API service
dco broker up -d   # Redpanda message broker
dco gateway up -d  # Caddy reverse proxy
dco media up -d    # imgproxy image service
dco pdf up -d      # PDF generation service
dco scheduler up -d # Ofelia cron jobs
dco status up -d   # Gatus uptime monitoring
dco observability up -d  # Observability stack (ClickHouse + OTel Collector + UI)
dco geo up -d      # Nominatim geocoding (optional, heavy)
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL TRAFFIC                                │
│                                    │                                         │
│                              ┌─────▼─────┐                                   │
│                              │   Caddy   │ :80, :443                         │
│                              │  gateway  │                                   │
│                              └─────┬─────┘                                   │
│                                    │                                         │
├────────────────────────────────────┼─────────────────────────────────────────┤
│                           INTERNAL NETWORK                                   │
│                                    │                                         │
│    ┌───────────────────────────────┼───────────────────────────────┐        │
│    │                               │                               │        │
│    ▼                               ▼                               ▼        │
│ ┌──────┐                      ┌─────────┐                    ┌─────────┐    │
│ │Svelte│ :5174 (dev)          │   Go    │ :8081              │imgproxy │    │
│ │ app  │ :3000 (prod)         │   API   │                    │  media  │    │
│ └──┬───┘                      └────┬────┘                    └─────────┘    │
│    │                               │                                         │
│    ├───────────────┬───────────────┤                                         │
│    │               │               │                                         │
│    ▼               ▼               ▼                                         │
│ ┌──────┐      ┌────────┐     ┌──────────┐     ┌───────────┐                 │
│ │ db   │      │  kv    │     │nominatim │     │  ofelia   │                 │
│ │:5432 │      │ :6379  │     │  :8090   │     │ scheduler │                 │
│ └──────┘      └────────┘     └──────────┘     └───────────┘                 │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                        OBSERVABILITY (internal network)                       │
│                                                                              │
│   ┌──────────────┐     ┌──────────────┐     ┌───────────────────┐           │
│   │otel-collector│────►│ telemetry-db │     │  observability-ui │           │
│   │ :4317/:4318  │     │ (ClickHouse) │◄────│  :5175 / :3001    │           │
│   └──────────────┘     │ :9000/:8123  │     └───────────────────┘           │
│                        └──────────────┘                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
infra/
├── development/           # Development environment
├── storage/              # PostgreSQL + Valkey + Object Store
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
├── app/                  # SvelteKit web application
├── consumer/             # Kafka consumer workers
├── api/                  # Go API service
├── broker/               # Redpanda message broker
├── gateway/              # Caddy reverse proxy + Caddyfiles
├── media/                # imgproxy image processing
├── pdf/                  # PDF generation service
├── geo/                  # Nominatim geocoding
├── scheduler/            # Ofelia cron jobs
├── status/               # Gatus uptime monitoring
├── observability/        # ClickHouse + OTel Collector + UI
├── autoheal/             # Container health monitoring
├── .env.dev              # Development environment variables
├── .env.prod             # Production secrets (encrypted)
└── README.md             # This file
```

## Networks

### internal (external)
Shared network for all application services. Must be created before starting:
```bash
docker network create internal
```

**Connected services:**
- db (PostgreSQL)
- kv (Redis-compatible cache)
- object (MinIO object storage)
- svelte (SvelteKit web app)
- go (Go API)
- caddy (Reverse proxy)
- image (imgproxy)
- redpanda (Message broker)
- pdf (PDF generation)
- nominatim (Geocoding)
- gatus (Status monitoring)
- ofelia (Scheduler)
- telemetry-db (ClickHouse)
- otel-collector
- observability-ui

## Services

### Core Application

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| db | postgis/postgis:17-3.4 | 5432 | PostgreSQL with PostGIS |
| kv | valkey/valkey:7.2 | 6379 | Redis-compatible cache |
| object | rustfs/rustfs | 9000, 9001 | S3-compatible object storage |
| svelte | custom | 5174/3000 | SvelteKit web application |
| go | custom | 8081 | Go API service |

### Infrastructure

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| caddy | caddy:2.8 | 80, 443 | Reverse proxy, TLS termination |
| image | darthsim/imgproxy:v3.24.1 | 8080 | Image optimization & WebP |
| redpanda | redpandadata/redpanda:v24.3.1 | 9092, 9644 | Kafka-compatible message broker |
| pdf | custom | 8082 | PDF generation service |
| nominatim | mediagis/nominatim:4.4 | 8090 | Address geocoding (Argentina) |
| gatus | twinproduction/gatus:v5.14.0 | - | Uptime and status monitoring |
| ofelia | mcuadros/ofelia:v0.3.12 | - | Docker-native cron scheduler |

### Observability

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| telemetry-db | clickhouse/clickhouse-server:24.1.2-alpine | 8123 | Traces, logs, metrics storage |
| otel-collector | otel/opentelemetry-collector-contrib:0.98.0 | 4317, 4318 | OTLP receiver → ClickHouse exporter |
| observability-ui | custom (SvelteKit) | 5175/3001 | Log explorer, trace viewer |

### Backup (Production Only)

| Service | Image | Purpose |
|---------|-------|---------|
| backup-worker | custom (postgres:17-alpine + age) | Encrypted database dumps |
| backup-uploader | rclone/rclone:1.68 | Upload to Cloudflare R2 |

## Resource Limits

All services have memory and CPU limits configured:

| Service | Memory (Dev) | Memory (Prod) | CPU Limit |
|---------|--------------|---------------|-----------|
| db | 512M | 1G | 1.0-2.0 |
| kv | 256M | 512M | 0.5 |
| object | 512M | 1G | 1.0-2.0 |
| svelte | 1G | 2G | 2.0 |
| go | 256M | 512M | 1.0 |
| caddy | 128M | 256M | 0.5-1.0 |
| imgproxy | 256M | 512M | 1.0-2.0 |
| redpanda | 512M | 1G | 1.0 |
| pdf | 1G | 1G | 1.0 |
| nominatim | 8G | 8G | 4.0 |
| gatus | 128M | 128M | 0.25 |
| ofelia | 64M | 128M | 0.25 |
| telemetry-db | 1G | 1G | 1.0 |
| otel-collector | 256M | 256M | 0.5 |
| observability-ui | 512M | 256M | 0.5-1.0 |

## Health Checks

All services have health checks configured:

| Service | Check Method | Interval |
|---------|--------------|----------|
| db | pg_isready | 10s |
| kv | valkey-cli ping | 10s |
| object | mc ready local | 10s |
| svelte | HTTP /health | 30s |
| go | HTTP /health | 10s |
| caddy | wget localhost:80 | 10s |
| imgproxy | imgproxy health | 10s |
| redpanda | rpk cluster health | 15s |
| pdf | HTTP /health | 10s |
| nominatim | HTTP /status | 30s |
| ofelia | pgrep ofelia | 30s |
| telemetry-db | wget /ping | 30s |
| otel-collector | HTTP :13133/ | 30s |
| observability-ui | HTTP /health | 30s |

## Logging

All services use JSON logging with rotation:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"  # 10-100MB depending on service
    max-file: "3"    # 3-5 files
```

## Backup Strategy

### Production

1. **Daily at 3:00 AM**: pg_dump → gzip → age encrypt
2. **Daily at 3:15 PM**: rclone sync to Cloudflare R2
3. **Daily at 6:00 AM**: Monitor checks for recent backup
4. **Retention**: 7 days local, indefinite on R2

### Development

1. **Daily at 3:00 AM**: pg_dump → gzip (no encryption)
2. **Retention**: 7 days

### Manual Backup/Restore

```bash
# Create manual backup
just backup

# Test restore (creates temporary database)
just restore-test

# Restore specific backup
just restore-test backups/habita_20240101_030000.sql.gz.age
```

## Security

### Secrets Management
- Environment files encrypted with SOPS + Age
- Decrypt: `just secrets decrypt`
- Encrypt: `just secrets encrypt`

### Non-Root Containers
- Production imgproxy runs as user 1000:1000
- Development imgproxy needs root for custom CA certificates
- Backup worker runs as user 10001

## Monitoring

### Observability UI
- Dev: https://observability.dev.habita.rent
- Prod: https://observability.habita.rent

Features:
- Log explorer with service/severity filtering
- Trace list with duration and status
- Trace detail with span waterfall visualization
- Cross-subdomain auth via Better Auth

### ClickHouse Direct Queries
```bash
# Check trace count
curl "http://localhost:8123/?query=SELECT+count()+FROM+otel.otel_traces"

# Check log count
curl "http://localhost:8123/?query=SELECT+count()+FROM+otel.otel_logs"

# List services sending telemetry
curl "http://localhost:8123/?query=SELECT+DISTINCT+ServiceName+FROM+otel.otel_traces"
```

## Troubleshooting

### Services not connecting
```bash
# Verify network exists
docker network ls | grep internal

# Create if missing
docker network create internal
```

### View service logs
```bash
just logs svelte
just logs telemetry-db
just logs otel-collector
```

### Check health status
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Reset observability data
```bash
# Stop observability stack and delete ClickHouse volume
docker compose -p observability down -v
just up
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `just up` | Start all services |
| `just down` | Stop all services |
| `dco <project> up -d` | Start specific project |
| `dco <project> logs -f` | Follow logs |
| `dco <project> restart` | Restart services |
| `just backup` | Manual database backup |
| `just restore-test` | Test backup restore |
| `just secrets decrypt` | Decrypt .env files |
| `just secrets encrypt` | Encrypt .env files |

# Habita Infrastructure

This document describes the Docker infrastructure architecture for Habita.

## Quick Start

```bash
# Start all services (development)
just up

# Or use dco for individual projects
dco app up -d      # Database, cache, and web app
dco api up -d      # Go API service
dco gateway up -d  # Caddy reverse proxy
dco media up -d    # imgproxy image service
dco scheduler up -d # Ofelia cron jobs
dco obs up -d      # Observability stack (optional)
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
│ │ db   │      │ valkey │     │nominatim │     │  ofelia   │                 │
│ │:5432 │      │ :6379  │     │  :8090   │     │ scheduler │                 │
│ └──────┘      └────────┘     └──────────┘     └───────────┘                 │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                        OBSERVABILITY NETWORK                                 │
│                                                                              │
│   ┌──────────────┐     ┌────────────┐     ┌──────────────┐                  │
│   │otel-collector│◄────│query-service│────►│  clickhouse  │                  │
│   │ :4317/:4318  │     │   :8080    │     │ :9000/:8123  │                  │
│   └──────────────┘     └────────────┘     └──────┬───────┘                  │
│          │                   │                    │                          │
│          │                   ▼                    ▼                          │
│          │             ┌──────────┐         ┌───────────┐                   │
│          └────────────►│ frontend │         │ zookeeper │                   │
│                        │  :3301   │         │   :2181   │                   │
│                        └──────────┘         └───────────┘                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
infra/
├── development/           # Development environment
│   ├── app/              # PostgreSQL + Valkey + SvelteKit
│   ├── api/              # Go API service
│   ├── gateway/          # Caddy reverse proxy (dev certs)
│   ├── media/            # imgproxy image processing
│   ├── geo/              # Nominatim geocoding
│   ├── scheduler/        # Ofelia cron jobs
│   ├── observability/    # SigNoz stack
│   └── .env              # Environment variables
│
├── production/           # Production environment
│   ├── app/              # PostgreSQL + Valkey + SvelteKit
│   ├── api/              # Go API service
│   ├── gateway/          # Caddy (Let's Encrypt)
│   ├── media/            # imgproxy
│   ├── geo/              # Nominatim
│   ├── scheduler/        # Ofelia + backup containers
│   └── .env              # Production secrets
│
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
- valkey (Redis-compatible cache)
- svelte (SvelteKit web app)
- go (Go API)
- caddy (Reverse proxy)
- image (imgproxy)
- nominatim (Geocoding)
- ofelia (Scheduler)
- otel-collector (bridges to observability)

### observability (bridge)
Isolated network for the SigNoz monitoring stack.

**Connected services:**
- zookeeper-1
- clickhouse
- query-service
- otel-collector (also on internal)
- frontend

## Services

### Core Application

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| db | postgis/postgis:17-3.4 | 5432 | PostgreSQL with PostGIS |
| valkey | valkey/valkey:7.2 | 6379 | Redis-compatible cache |
| svelte | custom | 5174/3000 | SvelteKit web application |
| go | custom | 8081 | Go API service |

### Infrastructure

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| caddy | caddy:2.8 | 80, 443 | Reverse proxy, TLS termination |
| image | darthsim/imgproxy:v3.24.1 | 8080 | Image optimization & WebP |
| nominatim | mediagis/nominatim:4.4 | 8090 | Address geocoding (Argentina) |
| ofelia | mcuadros/ofelia:v0.3.12 | - | Docker-native cron scheduler |

### Observability (SigNoz)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| zookeeper-1 | signoz/zookeeper:3.7.1 | 2181 | Coordination service |
| clickhouse | clickhouse/clickhouse-server:24.1.2-alpine | 9000, 8123 | Analytics database |
| query-service | signoz/query-service:0.69.0 | 8080 | SigNoz query engine |
| otel-collector | signoz/signoz-otel-collector:0.111.16 | 4317, 4318 | OpenTelemetry collector |
| frontend | signoz/frontend:0.69.0 | 3301 | SigNoz dashboard |

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
| valkey | 256M | 512M | 0.5 |
| svelte | 1G | 2G | 2.0 |
| go | 256M | 512M | 1.0 |
| caddy | 128M | 256M | 0.5-1.0 |
| imgproxy | 256M | 512M | 1.0-2.0 |
| nominatim | 8G | 8G | 4.0 |
| ofelia | 64M | 128M | 0.25 |
| clickhouse | 2G | - | - |

## Health Checks

All services have health checks configured:

| Service | Check Method | Interval |
|---------|--------------|----------|
| db | pg_isready | 5-10s |
| valkey | valkey-cli ping | 5-10s |
| svelte | HTTP /health | 30s |
| go | HTTP /health | 10s |
| caddy | wget localhost:80 | 10s |
| imgproxy | imgproxy health | 10s |
| nominatim | HTTP /status | 30s |
| ofelia | pgrep ofelia | 30s |
| clickhouse | wget /ping | 30s |
| query-service | HTTP /api/v1/health | 30s |
| otel-collector | HTTP :13133/ | 30s |
| frontend | wget localhost:3301 | 30s |

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

### ClickHouse Password
Password: `signoz_clickhouse_secure_2024`
- SHA256 hash in `clickhouse-users.xml`
- Used in OTel collector connection strings
- Network restricted to Docker internal networks

### Secrets Management
- Environment files encrypted with SOPS + Age
- Decrypt: `just secrets-decrypt`
- Encrypt: `just secrets-encrypt`

### Non-Root Containers
- Production imgproxy runs as user 1000:1000
- Development imgproxy needs root for custom CA certificates
- Backup worker runs as user 10001

## Monitoring

### SigNoz Dashboard
Access at: http://localhost:3301

Features:
- Distributed tracing
- Metrics visualization
- Log aggregation
- Custom dashboards

### Prometheus Alerts
Configured alerts in `observability/alerts.yml`:
- High memory usage
- Container restarts
- Database connection limits
- High error rates
- High latency
- Backup age monitoring

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
dco app logs -f svelte
dco obs logs -f clickhouse
```

### Check health status
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Reset observability data
```bash
dco obs down -v
dco obs up -d
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
| `just secrets-decrypt` | Decrypt .env files |
| `just secrets-encrypt` | Encrypt .env files |

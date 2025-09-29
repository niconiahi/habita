# Production Deployment Guide

## Overview

This guide walks you through deploying the Memudo application to a Digital Ocean droplet. Your application is already well-dockerized with a complete multi-service architecture, so you're about 80% ready for production deployment.

## Current Application Stack

- **Frontend/Backend**: React Router 7 app (port 5173)
- **Database**: PostGIS/PostgreSQL 17 (port 5432)
- **Cache**: Valkey/Redis (port 6379)
- **API Service**: Go service (port 8081)
- **Reverse Proxy**: Caddy with TLS
- **Geocoding**: Nominatim service (port 8080)

## Prerequisites

- Digital Ocean droplet (minimum 4GB RAM recommended due to Nominatim)
- Domain name pointing to your droplet IP
- SSH access to your droplet

## Phase 1: Server Setup (30 minutes)

### 1.1 Connect to Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 1.2 Install Docker and Docker Compose

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 1.3 Set Up Firewall

```bash
# Install and configure UFW
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable
```

### 1.4 Create Application Directory

```bash
mkdir -p /opt/memudo
cd /opt/memudo
```

## Phase 2: Production Configuration (45 minutes)

### 2.1 Clone Your Repository

```bash
# Clone your repository
git clone YOUR_REPOSITORY_URL .

# Or if you prefer to copy files manually:
# rsync -avz --exclude node_modules --exclude .git /path/to/local/memudo/ root@YOUR_DROPLET_IP:/opt/memudo/
```

### 2.2 Create Production Docker Compose

Create `run/production/docker-compose.yml`:

```yaml
services:
  db:
    image: postgis/postgis:17-3.4
    restart: unless-stopped
    env_file:
      - ../../.env.production
    volumes:
      - memudo_app_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512M

  app:
    build:
      context: ../../
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - ../../.env.production
    environment:
      PORT: 5173
      DATABASE_URL: postgres://$$POSTGRES_USER:$$POSTGRES_PASSWORD@db:5432/$$POSTGRES_DB
      REDIS_URL: redis://valkey:6379
    depends_on:
      db:
        condition: service_healthy
      valkey:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 1G

  valkey:
    image: valkey/valkey:7
    restart: unless-stopped
    volumes:
      - memudo_valkey_data:/data
    healthcheck:
      test: ["CMD", "valkey-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 256M

  go:
    build:
      context: ../../
      dockerfile: run/development/go/Dockerfile
    restart: unless-stopped
    env_file:
      - ../../.env.production
    environment:
      PORT: 8081
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "sh", "-lc", "curl -fsS http://localhost:8081/health || exit 1"]
      interval: 10s
      timeout: 2s
      retries: 10
    deploy:
      resources:
        limits:
          memory: 256M

  caddy:
    image: caddy:2
    restart: unless-stopped
    depends_on:
      go:
        condition: service_healthy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    deploy:
      resources:
        limits:
          memory: 128M

  nominatim:
    image: mediagis/nominatim:4.4
    container_name: nominatim
    environment:
      - PBF_URL=https://download.geofabrik.de/south-america/argentina-latest.osm.pbf
      - REPLICATION_URL=https://download.geofabrik.de/south-america/argentina-updates/
      - IMPORT_WIKIPEDIA=false
      - IMPORT_US_POSTCODES=false
      - IMPORT_GB_POSTCODES=false
    volumes:
      - memudo_nominatim_data:/var/lib/postgresql/14/main
    shm_size: 1gb
    deploy:
      resources:
        limits:
          memory: 8G
        reservations:
          memory: 4G

volumes:
  memudo_app_data:
  memudo_nominatim_data:
  memudo_valkey_data:
  caddy_data:
  caddy_config:
```

### 2.3 Create Production Caddyfile

Create `run/production/Caddyfile`:

```caddyfile
memudo.rent {
  handle /nominatim/* {
    uri strip_prefix /nominatim
    reverse_proxy nominatim:8080
  }

  reverse_proxy app:5173
}
```

### 2.4 Create Production Environment File

Create `.env.production`:

```bash
# Database Configuration
POSTGRES_USER=memudo_user
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE
POSTGRES_DB=memudo_production
POSTGRES_HOST=db

# Server Configuration
DROPLET_IP=YOUR_DROPLET_IP
```

**Important**: Replace `YOUR_SECURE_PASSWORD_HERE` with a strong password and `YOUR_DROPLET_IP` with your actual droplet IP.

## Phase 3: Deployment (30 minutes)

### 3.1 Build and Start Services

```bash
cd /opt/memudo

# Build and start all services
docker compose --file run/production/docker-compose.yml up -d

# Check service status
docker compose --file run/production/docker-compose.yml ps
```

### 3.2 Run Database Migrations

```bash
# Wait for services to be healthy, then run migrations
docker compose --file run/production/docker-compose.yml exec app bun kysely migrate:latest

# Optional: Seed the database
docker compose --file run/production/docker-compose.yml exec app bun kysely seed:run
```

### 3.3 Verify Deployment

```bash
# Check logs
docker compose --file run/production/docker-compose.yml logs -f app

# Test database connectivity
docker compose --file run/production/docker-compose.yml exec app bun kysely migrate:latest
```

### 3.4 Test Your Application

1. Visit `https://memudo.rent` in your browser
2. Verify SSL certificate is working
3. Test main application functionality
4. Check that Nominatim is accessible at `https://memudo.rent/nominatim`

## Post-Deployment Tasks

### Database Backups

Create a backup script at `/opt/memudo/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/memudo/backups"
mkdir -p $BACKUP_DIR

docker compose --file run/production/docker-compose.yml exec -T db pg_dump -U memudo_user memudo_production > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Make it executable and add to cron:

```bash
chmod +x /opt/memudo/backup.sh
crontab -e
# Add this line for daily backups at 2 AM:
# 0 2 * * * /opt/memudo/backup.sh
```

### Log Rotation

```bash
# Configure log rotation for Docker containers
cat > /etc/logrotate.d/docker-containers << EOF
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  size=1M
  missingok
  delaycompress
  copytruncate
}
EOF
```

### Monitoring

Check service health:

```bash
# Quick health check script
cat > /opt/memudo/health-check.sh << EOF
#!/bin/bash
cd /opt/memudo
docker compose --file run/production/docker-compose.yml ps
curl -f https://memudo.rent/health || echo "App health check failed"
EOF

chmod +x /opt/memudo/health-check.sh
```

## Useful Commands

### Managing the Application

```bash
# Navigate to app directory
cd /opt/memudo

# View logs
docker compose --file run/production/docker-compose.yml logs -f [service_name]

# Restart a service
docker compose --file run/production/docker-compose.yml restart [service_name]

# Update application (after git pull)
docker compose --file run/production/docker-compose.yml up -d --build

# Stop all services
docker compose --file run/production/docker-compose.yml down

# Stop and remove volumes (DANGER: deletes data)
docker compose --file run/production/docker-compose.yml down --volumes
```

### Database Operations

```bash
# Connect to database
docker compose --file run/production/docker-compose.yml exec db psql -U memudo_user -d memudo_production

# Run migrations
docker compose --file run/production/docker-compose.yml exec app bun kysely migrate:latest

# Generate types
docker compose --file run/production/docker-compose.yml exec app bun run db/generate_types.mjs
```

## Troubleshooting

### Common Issues

1. **Services not starting**: Check logs with `docker compose logs [service_name]`
2. **Database connection issues**: Verify environment variables and service dependencies
3. **SSL certificate issues**: Check domain DNS settings and Caddy logs
4. **Out of memory**: Monitor resource usage with `docker stats`

### Resource Monitoring

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker resource usage
docker stats

# Check service status
systemctl status docker
```

## Security Considerations

1. **Firewall**: Only ports 22, 80, and 443 should be open
2. **SSH**: Consider disabling password authentication and using key-based auth only
3. **Database**: Use strong passwords and consider restricting database access
4. **Updates**: Regularly update the server and Docker images
5. **Backups**: Test backup restoration procedures

## Estimated Timeline

- **Phase 1 (Server Setup)**: 30 minutes
- **Phase 2 (Configuration)**: 45 minutes
- **Phase 3 (Deployment)**: 30 minutes
- **Total**: ~2 hours

You're about 80% ready for production since your Docker setup is already comprehensive!

# Production Deployment Guide - Scripted Automation

## Overview

This guide provides a fully scripted approach to deploying the Memudo application to a Digital Ocean droplet. Instead of running terminal commands manually, you'll execute bash scripts that automate the entire deployment process.

## Prerequisites

- Digital Ocean droplet (minimum 4GB RAM recommended due to Nominatim)
- Domain name pointing to your droplet IP
- SSH access to your droplet
- Local machine with bash and ssh client

## Directory Structure

All deployment scripts will be organized as follows:

```
scripts/
├── deploy/
│   ├── 01-setup-server.sh        # Server initialization and Docker setup
│   ├── 02-configure-app.sh       # Application configuration
│   ├── 03-deploy-app.sh          # Application deployment
│   └── 04-post-deployment.sh     # Backup and monitoring setup
├── templates/
│   ├── .env.production.template
│   ├── Caddyfile.template
│   └── docker-compose.production.template
├── utils/
│   ├── backup.sh
│   ├── health-check.sh
│   └── update-app.sh
└── deploy-production.sh          # Main deployment orchestrator
```

## Script Contents

### Main Deployment Orchestrator

**File: `scripts/deploy-production.sh`**

```bash
#!/bin/bash
set -euo pipefail

# Main deployment orchestrator for Memudo production deployment
DROPLET_IP=${1:-}
DOMAIN=${2:-}
DB_PASSWORD=${3:-}

if [[ -z "$DROPLET_IP" ]]; then
    echo "Usage: $0 <DROPLET_IP> <DOMAIN> [DB_PASSWORD]"
    echo "Example: $0 192.168.1.100 memudo.rent"
    exit 1
fi

if [[ -z "$DOMAIN" ]]; then
    echo "Error: Domain is required"
    echo "Usage: $0 <DROPLET_IP> <DOMAIN> [DB_PASSWORD]"
    exit 1
fi

# Generate secure password if not provided
if [[ -z "$DB_PASSWORD" ]]; then
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    echo "Generated database password: $DB_PASSWORD"
fi

echo "Starting complete deployment for $DOMAIN on $DROPLET_IP"

# Phase 1: Server Setup
echo "Phase 1: Setting up server..."
./scripts/deploy/01-setup-server.sh "$DROPLET_IP"

# Phase 2: Configure Application
echo "Phase 2: Configuring application..."
./scripts/deploy/02-configure-app.sh "$DROPLET_IP" "$DOMAIN" "$DB_PASSWORD"

# Phase 3: Deploy Application
echo "Phase 3: Deploying application..."
./scripts/deploy/03-deploy-app.sh "$DROPLET_IP"

# Phase 4: Post-deployment setup
echo "Phase 4: Setting up monitoring and backups..."
./scripts/deploy/04-post-deployment.sh "$DROPLET_IP"

echo "Deployment completed successfully!"
echo "Your application is available at: https://$DOMAIN"
echo "Database password: $DB_PASSWORD"
```

### Server Setup Script

**File: `scripts/deploy/01-setup-server.sh`**

```bash
#!/bin/bash
set -euo pipefail

DROPLET_IP=${1:-}

if [[ -z "$DROPLET_IP" ]]; then
    echo "Usage: $0 <DROPLET_IP>"
    exit 1
fi

echo "Setting up server at $DROPLET_IP..."

# Connect to server and run setup commands
ssh -o StrictHostKeyChecking=no root@"$DROPLET_IP" << 'EOF'
set -euo pipefail

echo "Updating system packages..."
apt update && apt upgrade -y

echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

echo "Installing Docker Compose..."
apt install docker-compose-plugin -y

echo "Verifying Docker installation..."
docker --version
docker compose version

echo "Configuring firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

echo "Creating application directory..."
mkdir -p /opt/memudo
cd /opt/memudo

echo "Server setup completed successfully!"
EOF

echo "Server setup completed for $DROPLET_IP"
```

### Application Configuration Script

**File: `scripts/deploy/02-configure-app.sh`**

```bash
#!/bin/bash
set -euo pipefail

DROPLET_IP=${1:-}
DOMAIN=${2:-}
DB_PASSWORD=${3:-}

if [[ -z "$DROPLET_IP" ]] || [[ -z "$DOMAIN" ]] || [[ -z "$DB_PASSWORD" ]]; then
    echo "Usage: $0 <DROPLET_IP> <DOMAIN> <DB_PASSWORD>"
    exit 1
fi

echo "Configuring application on $DROPLET_IP..."

# Copy repository to server
echo "Copying repository to server..."
rsync -avz --exclude node_modules --exclude .git --exclude build ./ root@"$DROPLET_IP":/opt/memudo/

# Create production configuration files on server
ssh root@"$DROPLET_IP" << EOF
set -euo pipefail
cd /opt/memudo

echo "Creating production environment file..."
cat > .env.production << 'ENVEOF'
# Database Configuration
POSTGRES_USER=memudo_user
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=memudo_production
POSTGRES_HOST=db

# Server Configuration
DROPLET_IP=$DROPLET_IP
ENVEOF

echo "Creating production Docker Compose file..."
mkdir -p run/production
cat > run/production/docker-compose.yml << 'COMPOSEEOF'
services:
  db:
    image: postgis/postgis:17-3.4
    restart: unless-stopped
    env_file:
      - ../../.env.production
    volumes:
      - memudo_app_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \$\$POSTGRES_USER -d \$\$POSTGRES_DB"]
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
      DATABASE_URL: postgres://\$\$POSTGRES_USER:\$\$POSTGRES_PASSWORD@db:5432/\$\$POSTGRES_DB
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
COMPOSEEOF

echo "Creating Caddyfile..."
cat > run/production/Caddyfile << 'CADDYEOF'
$DOMAIN {
  handle /nominatim/* {
    uri strip_prefix /nominatim
    reverse_proxy nominatim:8080
  }

  reverse_proxy app:5173
}
CADDYEOF

echo "Application configuration completed!"
EOF

echo "Application configuration completed for $DROPLET_IP"
```

### Application Deployment Script

**File: `scripts/deploy/03-deploy-app.sh`**

```bash
#!/bin/bash
set -euo pipefail

DROPLET_IP=${1:-}

if [[ -z "$DROPLET_IP" ]]; then
    echo "Usage: $0 <DROPLET_IP>"
    exit 1
fi

echo "Deploying application on $DROPLET_IP..."

ssh root@"$DROPLET_IP" << 'EOF'
set -euo pipefail
cd /opt/memudo

echo "Building and starting services..."
docker compose --file run/production/docker-compose.yml up -d --build

echo "Waiting for services to be healthy..."
sleep 30

echo "Checking service status..."
docker compose --file run/production/docker-compose.yml ps

echo "Running database migrations..."
docker compose --file run/production/docker-compose.yml exec app bun kysely migrate:latest

echo "Optionally seeding database..."
read -p "Do you want to seed the database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose --file run/production/docker-compose.yml exec app bun kysely seed:run
fi

echo "Verifying deployment..."
docker compose --file run/production/docker-compose.yml logs --tail=10 app

echo "Application deployment completed!"
EOF

echo "Application deployment completed for $DROPLET_IP"
```

### Post-Deployment Setup Script

**File: `scripts/deploy/04-post-deployment.sh`**

```bash
#!/bin/bash
set -euo pipefail

DROPLET_IP=${1:-}

if [[ -z "$DROPLET_IP" ]]; then
    echo "Usage: $0 <DROPLET_IP>"
    exit 1
fi

echo "Setting up post-deployment tasks on $DROPLET_IP..."

ssh root@"$DROPLET_IP" << 'EOF'
set -euo pipefail
cd /opt/memudo

echo "Creating backup script..."
cat > backup.sh << 'BACKUPEOF'
#!/bin/bash
BACKUP_DIR="/opt/memudo/backups"
mkdir -p $BACKUP_DIR

docker compose --file run/production/docker-compose.yml exec -T db pg_dump -U memudo_user memudo_production > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
BACKUPEOF

chmod +x backup.sh

echo "Creating health check script..."
cat > health-check.sh << 'HEALTHEOF'
#!/bin/bash
cd /opt/memudo
echo "=== Docker Services Status ==="
docker compose --file run/production/docker-compose.yml ps

echo -e "\n=== Application Health Check ==="
curl -f https://$(grep DROPLET_IP .env.production | cut -d= -f2)/health || echo "App health check failed"

echo -e "\n=== Resource Usage ==="
docker stats --no-stream

echo -e "\n=== Disk Usage ==="
df -h /opt/memudo
HEALTHEOF

chmod +x health-check.sh

echo "Setting up log rotation..."
cat > /etc/logrotate.d/docker-containers << 'LOGEOF'
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  size=1M
  missingok
  delaycompress
  copytruncate
}
LOGEOF

echo "Setting up cron job for daily backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/memudo/backup.sh") | crontab -

echo "Post-deployment setup completed!"
EOF

echo "Post-deployment setup completed for $DROPLET_IP"
```

### Utility Scripts

#### Update Application Script

**File: `scripts/utils/update-app.sh`**

```bash
#!/bin/bash
set -euo pipefail

DROPLET_IP=${1:-}

if [[ -z "$DROPLET_IP" ]]; then
    echo "Usage: $0 <DROPLET_IP>"
    exit 1
fi

echo "Updating application on $DROPLET_IP..."

# Copy updated code to server
rsync -avz --exclude node_modules --exclude .git --exclude build ./ root@"$DROPLET_IP":/opt/memudo/

ssh root@"$DROPLET_IP" << 'EOF'
set -euo pipefail
cd /opt/memudo

echo "Pulling latest changes..."
git pull origin main

echo "Rebuilding and restarting services..."
docker compose --file run/production/docker-compose.yml up -d --build

echo "Running database migrations..."
docker compose --file run/production/docker-compose.yml exec app bun kysely migrate:latest

echo "Checking service status..."
docker compose --file run/production/docker-compose.yml ps

echo "Application update completed!"
EOF

echo "Application update completed for $DROPLET_IP"
```

#### Health Check Script

**File: `scripts/utils/health-check.sh`**

```bash
#!/bin/bash
set -euo pipefail

DROPLET_IP=${1:-}

if [[ -z "$DROPLET_IP" ]]; then
    echo "Usage: $0 <DROPLET_IP>"
    exit 1
fi

echo "Running health check on $DROPLET_IP..."

ssh root@"$DROPLET_IP" << 'EOF'
set -euo pipefail
cd /opt/memudo

echo "=== Docker Services Status ==="
docker compose --file run/production/docker-compose.yml ps

echo -e "\n=== Service Health Checks ==="
docker compose --file run/production/docker-compose.yml exec db pg_isready -U memudo_user -d memudo_production
docker compose --file run/production/docker-compose.yml exec valkey valkey-cli ping
docker compose --file run/production/docker-compose.yml exec go curl -f http://localhost:8081/health

echo -e "\n=== Resource Usage ==="
docker stats --no-stream

echo -e "\n=== Disk Usage ==="
df -h

echo -e "\n=== Memory Usage ==="
free -h

echo -e "\n=== Recent Logs ==="
docker compose --file run/production/docker-compose.yml logs --tail=5 app

echo "Health check completed!"
EOF
```

#### Database Backup Script

**File: `scripts/utils/backup.sh`**

```bash
#!/bin/bash
set -euo pipefail

DROPLET_IP=${1:-}

if [[ -z "$DROPLET_IP" ]]; then
    echo "Usage: $0 <DROPLET_IP>"
    exit 1
fi

echo "Creating database backup on $DROPLET_IP..."

ssh root@"$DROPLET_IP" << 'EOF'
set -euo pipefail
cd /opt/memudo

BACKUP_DIR="/opt/memudo/backups"
mkdir -p $BACKUP_DIR

BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

echo "Creating backup: $BACKUP_FILE"
docker compose --file run/production/docker-compose.yml exec -T db pg_dump -U memudo_user memudo_production > "$BACKUP_DIR/$BACKUP_FILE"

echo "Backup created successfully: $BACKUP_DIR/$BACKUP_FILE"
echo "Backup size: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Available backups:"
ls -lh $BACKUP_DIR/backup_*.sql
EOF
```

### Setup Scripts

#### Create All Scripts

**File: `scripts/create-all-scripts.sh`**

```bash
#!/bin/bash
set -euo pipefail

echo "Creating all deployment scripts..."

# Create directory structure
mkdir -p scripts/{deploy,utils,templates,troubleshoot}

# Create main deployment script
cat > scripts/deploy-production.sh << 'EOF'
# Main deployment orchestrator content (as shown above)
EOF

# Create deployment phase scripts
cat > scripts/deploy/01-setup-server.sh << 'EOF'
# Server setup script content (as shown above)
EOF

cat > scripts/deploy/02-configure-app.sh << 'EOF'
# Application configuration script content (as shown above)
EOF

cat > scripts/deploy/03-deploy-app.sh << 'EOF'
# Application deployment script content (as shown above)
EOF

cat > scripts/deploy/04-post-deployment.sh << 'EOF'
# Post-deployment setup script content (as shown above)
EOF

# Create utility scripts
cat > scripts/utils/update-app.sh << 'EOF'
# Update application script content (as shown above)
EOF

cat > scripts/utils/health-check.sh << 'EOF'
# Health check script content (as shown above)
EOF

cat > scripts/utils/backup.sh << 'EOF'
# Backup script content (as shown above)
EOF

# Create permission setting script
cat > scripts/set-permissions.sh << 'EOF'
#!/bin/bash
find scripts/ -name "*.sh" -exec chmod +x {} \;
echo "All scripts made executable"
EOF

echo "All scripts created successfully!"
echo "Run './scripts/set-permissions.sh' to make them executable"
```

#### Set Permissions Script

**File: `scripts/set-permissions.sh`**

```bash
#!/bin/bash
echo "Setting executable permissions on all scripts..."
find scripts/ -name "*.sh" -exec chmod +x {} \;
echo "All scripts are now executable"
```

#### Validation Script

**File: `scripts/validate-setup.sh`**

```bash
#!/bin/bash
set -euo pipefail

echo "Validating script setup..."

SCRIPTS=(
    "scripts/deploy-production.sh"
    "scripts/deploy/01-setup-server.sh"
    "scripts/deploy/02-configure-app.sh"
    "scripts/deploy/03-deploy-app.sh"
    "scripts/deploy/04-post-deployment.sh"
    "scripts/utils/update-app.sh"
    "scripts/utils/health-check.sh"
    "scripts/utils/backup.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [[ -f "$script" && -x "$script" ]]; then
        echo "✓ $script - OK"
    else
        echo "✗ $script - Missing or not executable"
    fi
done

echo "Validation completed!"
```

### Template Files

#### Environment Template

**File: `scripts/templates/.env.production.template`**

```bash
# Database Configuration
POSTGRES_USER=memudo_user
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=memudo_production
POSTGRES_HOST=db

# Server Configuration
DROPLET_IP=${DROPLET_IP}
```

#### Caddyfile Template

**File: `scripts/templates/Caddyfile.template`**

```caddyfile
${DOMAIN} {
  handle /nominatim/* {
    uri strip_prefix /nominatim
    reverse_proxy nominatim:8080
  }

  reverse_proxy app:5173
}
```

### Troubleshooting Scripts

#### Check Services Script

**File: `scripts/troubleshoot/check-services.sh`**

```bash
#!/bin/bash
set -euo pipefail

DROPLET_IP=${1:-}

if [[ -z "$DROPLET_IP" ]]; then
    echo "Usage: $0 <DROPLET_IP>"
    exit 1
fi

ssh root@"$DROPLET_IP" << 'EOF'
cd /opt/memudo

echo "=== Docker Services Status ==="
docker compose --file run/production/docker-compose.yml ps

echo -e "\n=== Service Health ==="
docker compose --file run/production/docker-compose.yml exec db pg_isready -U memudo_user -d memudo_production || echo "DB not ready"
docker compose --file run/production/docker-compose.yml exec valkey valkey-cli ping || echo "Valkey not ready"
docker compose --file run/production/docker-compose.yml exec go curl -f http://localhost:8081/health || echo "Go service not ready"

echo -e "\n=== Port Status ==="
ss -tlnp | grep -E ':(80|443|5432|6379|8081)'
EOF
```

#### View Logs Script

**File: `scripts/troubleshoot/view-logs.sh`**

```bash
#!/bin/bash
set -euo pipefail

DROPLET_IP=${1:-}
SERVICE=${2:-}

if [[ -z "$DROPLET_IP" ]]; then
    echo "Usage: $0 <DROPLET_IP> [service_name]"
    echo "Available services: app, db, valkey, go, caddy, nominatim"
    exit 1
fi

ssh root@"$DROPLET_IP" << EOF
cd /opt/memudo
if [[ -n "$SERVICE" ]]; then
    docker compose --file run/production/docker-compose.yml logs -f "$SERVICE"
else
    docker compose --file run/production/docker-compose.yml logs -f
fi
EOF
```

#### Restart Service Script

**File: `scripts/troubleshoot/restart-service.sh`**

```bash
#!/bin/bash
set -euo pipefail

DROPLET_IP=${1:-}
SERVICE=${2:-}

if [[ -z "$DROPLET_IP" ]] || [[ -z "$SERVICE" ]]; then
    echo "Usage: $0 <DROPLET_IP> <service_name>"
    echo "Available services: app, db, valkey, go, caddy, nominatim"
    exit 1
fi

ssh root@"$DROPLET_IP" << EOF
cd /opt/memudo
echo "Restarting service: $SERVICE"
docker compose --file run/production/docker-compose.yml restart "$SERVICE"
echo "Service $SERVICE restarted"
docker compose --file run/production/docker-compose.yml ps "$SERVICE"
EOF
```

## Usage Instructions

### Complete Deployment (One Command)

For a complete deployment from scratch, execute:

```bash
./scripts/deploy-production.sh <DROPLET_IP> <DOMAIN> [DB_PASSWORD]
```

Example:
```bash
./scripts/deploy-production.sh 192.168.1.100 memudo.rent
```

### Phase-by-Phase Deployment

#### Step 1: Initialize Server
```bash
./scripts/deploy/01-setup-server.sh <DROPLET_IP>
```

#### Step 2: Configure Application
```bash
./scripts/deploy/02-configure-app.sh <DROPLET_IP> <DOMAIN> <DB_PASSWORD>
```

#### Step 3: Deploy Application
```bash
./scripts/deploy/03-deploy-app.sh <DROPLET_IP>
```

#### Step 4: Post-Deployment Setup
```bash
./scripts/deploy/04-post-deployment.sh <DROPLET_IP>
```

### Management Operations

#### Update Application
```bash
./scripts/utils/update-app.sh <DROPLET_IP>
```

#### Health Check
```bash
./scripts/utils/health-check.sh <DROPLET_IP>
```

#### Manual Backup
```bash
./scripts/utils/backup.sh <DROPLET_IP>
```

### Troubleshooting

#### Check Service Status
```bash
./scripts/troubleshoot/check-services.sh <DROPLET_IP>
```

#### View Logs
```bash
./scripts/troubleshoot/view-logs.sh <DROPLET_IP> [service_name]
```

#### Restart Service
```bash
./scripts/troubleshoot/restart-service.sh <DROPLET_IP> <service_name>
```

## Initial Setup

### Step 1: Create All Scripts
```bash
./scripts/create-all-scripts.sh
```

### Step 2: Set Permissions
```bash
./scripts/set-permissions.sh
```

### Step 3: Validate Setup
```bash
./scripts/validate-setup.sh
```

## Security Features

All scripts include:
- Input validation and error handling
- Secure file permissions (`chmod +x` only where needed)
- Password generation using `openssl rand`
- Firewall configuration with UFW
- Service isolation through Docker
- SSH key-based authentication support

## Benefits

1. **Reproducibility**: Identical deployments every time
2. **Error Reduction**: No manual command typos
3. **Documentation**: Scripts serve as executable documentation
4. **Version Control**: Easy to track changes and rollback
5. **Team Sharing**: Consistent deployments across team members
6. **CI/CD Ready**: Scripts can be integrated into pipelines

## Estimated Timeline

- **Script Creation**: 10 minutes (one-time setup)
- **Complete Deployment**: 15-20 minutes (automated)
- **Updates**: 5 minutes (automated)

The scripted approach transforms a 2-hour manual process into a 15-20 minute automated deployment.
# Deploying to Production (Hetzner VPS)

**Target**: Hetzner VPS with 16GB RAM (CPX31 or CCX22)
**Domain**: habita.rent
**Deployment**: Docker Compose with GitHub Actions CI/CD

---

## Phase 1: Production Configuration

### 1.1 Add Cron Jobs to Production
- [ ] Add Ofelia service to `infra/production/docker-compose.yml`
- [ ] Create `infra/production/ofelia.ini` with jobs:
  - [ ] Create escalation jobs (every minute)
  - [ ] Process payment jobs (every minute)
- [ ] Configure Ofelia to connect to app container

### 1.2 Production Makefile Targets
- [ ] Add `prod-build` - build images on server
- [ ] Add `prod-up` - start all services
- [ ] Add `prod-down` - stop services
- [ ] Add `prod-restart` - restart services
- [ ] Add `prod-logs` - tail logs
- [ ] Add `prod-migrate` - run DB migrations
- [ ] Add `prod-status` - check container health

### 1.3 Environment Configuration
- [ ] Generate secure PostgreSQL password (using `openssl rand -base64 32` or similar)
- [ ] Create `.env.production` file with:
  - [ ] PostgreSQL credentials
  - [ ] Redis/Valkey URL
  - [ ] Google OAuth credentials (production)
  - [ ] Gmail SMTP credentials
  - [ ] Domain (habita.rent)
  - [ ] NODE_ENV=production

---

## Phase 2: VPS Server Setup

### 2.1 SSH Security Configuration
- [ ] Generate SSH key pair locally (if not already done)
- [ ] Add public key to VPS authorized_keys
- [ ] Disable password authentication in `/etc/ssh/sshd_config`
- [ ] Restart SSH service
- [ ] Test SSH key-based login

### 2.2 Firewall Setup (UFW)
- [ ] Install UFW: `apt install ufw`
- [ ] Allow SSH: `ufw allow 22/tcp`
- [ ] Allow HTTP: `ufw allow 80/tcp`
- [ ] Allow HTTPS: `ufw allow 443/tcp`
- [ ] Enable firewall: `ufw enable`
- [ ] Verify status: `ufw status`

### 2.3 Docker Installation
- [ ] Update packages: `apt update && apt upgrade -y`
- [ ] Install Docker: `curl -fsSL https://get.docker.com | sh`
- [ ] Install Docker Compose v2
- [ ] Add deployment user to docker group
- [ ] Test Docker: `docker run hello-world`

### 2.4 Directory Structure
- [ ] Create deployment directory: `mkdir -p /opt/habita`
- [ ] Create deployment user (non-root): `useradd -m -s /bin/bash habita`
- [ ] Set ownership: `chown -R habita:habita /opt/habita`
- [ ] Create directories:
  - [ ] `/opt/habita/scripts/` - deployment scripts
  - [ ] `/opt/habita/backups/` - database backups
  - [ ] `/opt/habita/logs/` - application logs

### 2.5 DNS Configuration
- [ ] Get VPS IP address from Hetzner
- [ ] Add A record: `habita.rent` → VPS IP
- [ ] Add A record: `www.habita.rent` → VPS IP
- [ ] Wait for DNS propagation (check with `dig habita.rent`)

---

## Phase 3: Initial Manual Deployment

### 3.1 Transfer Code to VPS
- [ ] Copy `.env.production` to VPS: `/opt/habita/.env.production`
- [ ] Rsync codebase to VPS:
  ```bash
  rsync -avz --exclude 'node_modules' \
    --exclude '.git' \
    /path/to/habita/ \
    habita@VPS_IP:/opt/habita/
  ```
- [ ] Verify all files transferred correctly

### 3.2 Build and Start Services
- [ ] SSH to VPS
- [ ] Navigate to `/opt/habita`
- [ ] Build images: `make prod-build`
- [ ] Start services: `make prod-up`
- [ ] Monitor logs: `make prod-logs`

### 3.3 Nominatim Setup (Long Running)
- [ ] Wait for Nominatim to import Argentina data (~2-4 hours)
- [ ] Monitor Nominatim logs: `docker logs -f production-nominatim-1`
- [ ] Verify Nominatim ready: `curl http://localhost:8080/status`

### 3.4 Database Setup
- [ ] Wait for PostgreSQL to be ready
- [ ] Run migrations: `make prod-migrate`
- [ ] Verify tables created: Connect to DB and check schema
- [ ] (Optional) Seed initial data if needed

### 3.5 Application Verification
- [ ] Check all containers running: `docker ps`
- [ ] Check app responds: `curl https://habita.rent`
- [ ] Test Nominatim proxy: `curl https://habita.rent/nominatim/status`
- [ ] Verify HTTPS certificates issued by Let's Encrypt
- [ ] Test OAuth login flow
- [ ] Test email sending (SMTP)

---

## Phase 4: CI/CD with GitHub Actions

### 4.1 Deployment Script on VPS
- [ ] Create `/opt/habita/scripts/deploy.sh`:
  - [ ] Pull latest code from Git or accept rsync
  - [ ] Backup current version
  - [ ] Build new Docker images
  - [ ] Stop old containers
  - [ ] Start new containers
  - [ ] Run migrations
  - [ ] Health check (verify app responds)
  - [ ] Rollback on failure
- [ ] Make script executable: `chmod +x /opt/habita/scripts/deploy.sh`
- [ ] Test script manually

### 4.2 GitHub Secrets Configuration
- [ ] Go to GitHub repo → Settings → Secrets and variables → Actions
- [ ] Add secrets:
  - [ ] `SSH_PRIVATE_KEY` - Private key for SSH to VPS
  - [ ] `VPS_HOST` - VPS IP address
  - [ ] `VPS_USER` - Deployment username (e.g., `habita`)
  - [ ] `VPS_PORT` - SSH port (default: 22)

### 4.3 GitHub Actions Workflow
- [ ] Create `.github/workflows/deploy.yml`:
  - [ ] Trigger on push to `main` branch
  - [ ] Checkout code
  - [ ] Setup SSH key from secrets
  - [ ] Rsync code to VPS (or git pull on VPS)
  - [ ] SSH to VPS and run deploy script
  - [ ] Report deployment status
- [ ] Commit and push workflow file
- [ ] Verify workflow appears in Actions tab

### 4.4 Test CI/CD Pipeline
- [ ] Make a small change (e.g., update README)
- [ ] Commit to `main` branch
- [ ] Watch GitHub Actions run
- [ ] Verify deployment succeeds
- [ ] Check app still works after deployment

---

## Phase 5: Post-Deployment Monitoring

### 5.1 Health Check Endpoint
- [ ] Add `/health` endpoint to web app:
  - [ ] Check database connection
  - [ ] Check Redis/Valkey connection
  - [ ] Check Nominatim availability
  - [ ] Return JSON with service status
- [ ] Test endpoint: `curl https://habita.rent/health`

### 5.2 Basic Monitoring
- [ ] Create health check script: `/opt/habita/scripts/health_check.sh`
  - [ ] Check all Docker containers running
  - [ ] Check app health endpoint
  - [ ] Check disk space
  - [ ] Check memory usage
  - [ ] Alert if issues (email or log)
- [ ] Add cron job to run health check every 5 minutes
- [ ] Test health check script

### 5.3 Log Management
- [ ] Configure Docker logs rotation
- [ ] Setup log viewing: `make prod-logs`
- [ ] Document log locations:
  - [ ] Caddy: `/var/log/caddy/access.log` (in container)
  - [ ] Docker logs: `docker logs <container>`

---

## Phase 6: Google OAuth Setup (Production)

### 6.1 Create Production OAuth App
- [ ] Go to Google Cloud Console
- [ ] Create new project or use existing
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URI: `https://habita.rent/auth/google/callback`
- [ ] Copy Client ID and Client Secret

### 6.2 Update Production Environment
- [ ] SSH to VPS
- [ ] Update `/opt/habita/.env.production`:
  - [ ] Set `GOOGLE_CLIENT_ID`
  - [ ] Set `GOOGLE_CLIENT_SECRET`
- [ ] Restart app: `make prod-restart`
- [ ] Test OAuth login

---

## Phase 7: Gmail SMTP Setup

### 7.1 Create Gmail App Password
- [ ] Enable 2FA on Gmail account
- [ ] Go to Google Account → Security → App passwords
- [ ] Generate app password for "Mail"
- [ ] Copy 16-character password

### 7.2 Update Production Environment
- [ ] SSH to VPS
- [ ] Update `/opt/habita/.env.production`:
  - [ ] Set `SMTP_HOST=smtp.gmail.com`
  - [ ] Set `SMTP_PORT=587`
  - [ ] Set `SMTP_USER=your-email@gmail.com`
  - [ ] Set `SMTP_PASS=<app-password>`
- [ ] Restart Go service: `docker compose -f infra/production/docker-compose.yml restart go`
- [ ] Test email sending

---

## Unresolved Questions

- [ ] VPS IP address? (will provide when ready)
- [ ] VPS OS? (Ubuntu 22.04 assumed)
- [ ] Want zero-downtime deploys or acceptable to have brief downtime?
- [ ] How many Docker image versions to keep for potential rollback?
- [ ] Should we setup database backups in this phase?
- [ ] Need staging environment or deploy directly to production?

---

## Resource Requirements (Confirmed)

**VPS Specs Required**:
- **RAM**: 16GB minimum (Nominatim needs 8GB)
- **CPU**: 4+ vCPU
- **Storage**: 160GB+ SSD
- **Recommended**: Hetzner CPX31 (8 vCPU, 16GB RAM, 240GB SSD, ~€20/month)

**Services Running**:
- Web App (Bun + React Router)
- Go Service (SMTP handler)
- PostgreSQL + PostGIS
- Valkey (Redis)
- Nominatim (geocoding)
- Caddy (reverse proxy)
- Ofelia (cron jobs)

---

## Notes

- Initial deployment will take 2-4 hours due to Nominatim import
- DNS propagation can take up to 48 hours (usually much faster)
- Let's Encrypt certificates are automatic via Caddy
- First deployment is manual, subsequent deploys via GitHub Actions
- All passwords should be generated securely (not hardcoded)

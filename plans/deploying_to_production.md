# Deploying to Production (Hetzner VPS)

**Target**: Hetzner VPS with 16GB RAM (CPX31 or CCX22)
**Domain**: habita.rent
**Deployment**: Docker Compose with GitHub Actions CI/CD

## 🚀 **PRODUCTION STATUS: LIVE**

**App URL**: https://habita.rent ✅

**Last Deployment**: Successfully deployed and operational
**Services**: All healthy (app, db, go, caddy, valkey, ofelia)
**CI/CD**: Automated deployments on push to `main` branch
**SSL**: Cloudflare proxy with automatic SSL/TLS

---

## Phase 1: Production Configuration ✅ COMPLETED

### 1.1 Add Cron Jobs to Production ✅
- [x] Add Ofelia service to `infra/production/docker-compose.yml`
- [x] Create `infra/production/ofelia.ini` with jobs:
  - [x] Create escalation jobs (every minute)
  - [x] Process payment jobs (every minute)
- [x] Configure Ofelia to connect to app container

### 1.2 Production Makefile Targets ✅
- [x] Add `prod-ssh` - SSH into production VPS
- [x] Add `prod-status` - check container health
- [x] Add `prod-logs` - tail logs (all services)
- [x] Add `prod-logs-*` - individual service logs (app, db, go, caddy, nominatim, ofelia)
- [x] Add `prod-db-migrate` - run DB migrations
- [x] Add `prod-db-shell` - open PostgreSQL shell

**Note:** Removed anti-pattern commands (`prod-up`, `prod-down`, `prod-restart`, `prod-build`) as deployment is handled by GitHub Actions.

### 1.3 Environment Configuration ✅
- [x] Generate secure PostgreSQL password (`openssl rand -base64 32`)
- [x] Create `.env.production` file with:
  - [x] PostgreSQL credentials
  - [x] Redis/Valkey URL
  - [x] Google OAuth credentials (placeholder - to be filled)
  - [x] Gmail SMTP credentials (placeholder - to be filled)
  - [x] Domain (habita.rent)
  - [x] NODE_ENV=production
  - [x] VPS connection details (HOST, USER, PORT)

---

## Phase 2: VPS Server Setup ✅ COMPLETED

**Documentation:** See `docs/setup_for_secure_vps.md` for detailed scripts and procedures.

### 2.1 SSH Security Configuration ✅
- [x] Generate SSH key pair locally (`~/.ssh/habita`)
- [x] Add public key to VPS authorized_keys
- [x] Disable password authentication in `/etc/ssh/sshd_config`
- [x] Disable root SSH login (`PermitRootLogin no`)
- [x] Move SSH keys from root to habita user
- [x] Restart SSH service
- [x] Test SSH key-based login as habita user

### 2.2 Firewall Setup (UFW) ✅
- [x] UFW already installed on Ubuntu 25.04
- [x] Allow SSH: `ufw allow 22/tcp`
- [x] Allow HTTP: `ufw allow 80/tcp`
- [x] Allow HTTPS: `ufw allow 443/tcp` + `443/udp` (HTTP/3)
- [x] Enable firewall: `ufw enable`
- [x] Verify status: Active, blocking all other ports

### 2.3 Docker Installation ✅
- [x] Docker already installed (v28.3.3)
- [x] Docker Compose already installed (v2.39.1)
- [x] Add deployment user to docker group
- [x] Test Docker: `docker run hello-world` ✅
- [x] Install `make` utility for running Makefile commands

### 2.4 User & Directory Setup ✅
- [x] Create deployment user: `habita`
- [x] Configure limited sudo (docker + systemctl only)
- [x] Create deployment directory: `/opt/habita`
- [x] Set ownership: `chown -R habita:habita /opt/habita`
- [x] Update `.env.production` to use `habita` user
- [x] Update `make prod-ssh` to use `habita` user

**Note:** Skipped unnecessary subdirectories (scripts/, backups/, logs/). Will create as needed.

### 2.5 DNS Configuration ✅ COMPLETED
- [x] VPS IP obtained: 209.38.143.22
- [x] Add A record: `habita.rent` → 209.38.143.22 (Proxied through Cloudflare)
- [x] Add CNAME record: `www` → `habita.rent` (Proxied through Cloudflare)
- [x] DNS propagated and resolving correctly
- [x] HTTPS working at https://habita.rent

**Setup:** Using Cloudflare proxy for DDoS protection + SSL termination, with Caddy as reverse proxy.

---

## Phase 3: Initial Deployment (UPDATED APPROACH)

**Context:** Original plan was to build on VPS, but discovered:
- Current VPS: 1GB RAM (not enough for building TypeScript/React apps)
- Need 16GB VPS for Nominatim runtime anyway
- **Solution:** Build images in GitHub Actions, push to Docker Hub, VPS pulls pre-built images

**Decision:** Use Docker Hub (1 private repository, free) with image tags:
- `niconiahi/habita:web-latest` - Web app
- `niconiahi/habita:go-latest` - Go service

### 3.1 Repository Setup on VPS ✅
- [x] Clone repository: `git clone git@github.com:niconiahi/habita.git /opt/habita`
- [x] Configure SSH deploy key for GitHub access
- [x] Copy `.env.production` to VPS
- [x] Create `make prod-push-env` command for future env updates

### 3.2 Docker Configuration ✅
- [x] Update `infra/production/docker-compose.yml` to use pre-built images:
  - `app: image: niconiahi/habita:web-latest`
  - `go: image: niconiahi/habita:go-latest`
- [x] Other services pull from public registries (PostgreSQL, Caddy, Nominatim, Valkey, Ofelia)

### 3.3 Docker Hub Setup ✅
- [x] Create Docker Hub account (username: niconiahi)
- [x] Create private repository: `habita`
- [x] Generate access token: `dckr_pat_...` (stored securely)

### 3.4 First Deployment (Pending - After GitHub Actions Setup)
Will be triggered automatically by GitHub Actions:
- [ ] GitHub Actions builds images
- [ ] Pushes to Docker Hub
- [ ] SSH to VPS
- [ ] Pull images
- [ ] Run migrations
- [ ] Start containers
- [ ] Wait for Nominatim import (~2-4 hours)
- [ ] Verify services

---

## Phase 4: CI/CD with GitHub Actions ✅ MOSTLY COMPLETED

**Strategy:** Build images in GitHub Actions (7GB RAM available), push to Docker Hub, deploy to VPS

### 4.1 GitHub Actions Workflow ✅
- [x] Created `.github/workflows/deploy.yml`:
  - Triggers on push to `main` branch
  - Login to Docker Hub (in GitHub Actions)
  - Build web app image (`niconiahi/habita:web-latest` + `web-{sha}`)
  - Build Go service image (`niconiahi/habita:go-latest` + `go-{sha}`)
  - Push both images to Docker Hub
  - SSH to VPS
  - Pull latest code (`git pull origin main`)
  - **Login to Docker Hub on VPS** (added to fix image pull auth)
  - Pull new images
  - Run migrations
  - Restart containers
  - Show deployment status

### 4.2 GitHub Secrets Configuration ✅ COMPLETED

**GitHub Secrets Added:**
- [x] `DOCKER_HUB_USERNAME` = `niconiahi`
- [x] `DOCKER_HUB_TOKEN` = Docker Hub access token
- [x] `VPS_HOST` = `209.38.143.22`
- [x] `VPS_USER` = `habita`
- [x] `VPS_PORT` = `22`
- [x] `SSH_PRIVATE_KEY` = Dedicated deploy key (`~/.ssh/habita_deploy`)

**Note:** Created separate SSH key pair for GitHub Actions → VPS (security best practice)

### 4.3 Production Build Fixes ✅ COMPLETED

**Context:** Initial deployment failed due to Vite/React Router build errors. Client/server code separation was breaking the build.

**Issues Fixed:**
1. **Server-only file naming convention**
   - [x] Renamed all files in `app/lib/server/` to use `.server.ts`/`.server.tsx` extension
   - [x] Renamed all files in `app/routes/*/actions/server/` to use `.server.ts` extension
   - [x] Renamed all server action files to `.server.ts`

2. **Shared type files moved**
   - [x] Moved pure type/constant files from `app/lib/server/` to `app/lib/`:
     - property_type, access_type, contract_state, fine_type, escalation_type
     - contract_file_type, duration, default_type, expense_type, slot_state
     - job_type, job_status, rate_type, contract_type, user_file_type

3. **Import path fixes**
   - [x] Updated all imports to use `.server` extensions
   - [x] Fixed db imports from `~/../../db/query_builder` to `db/query_builder`
   - [x] Fixed relative imports between server files
   - [x] Fixed action index.server.ts exports
   - [x] Fixed MDX formatter import

4. **Server/client code separation**
   - [x] Moved `get_img_props` call from component to loader (server-only)
   - [x] Created shared `Location` type for client use

5. **Vite configuration**
   - [x] Added `bun` to `ssr.external` and `build.rollupOptions.external`

6. **Build verification**
   - [x] Production build succeeds locally ✅
   - [x] Client bundle builds successfully
   - [x] SSR bundle builds successfully

### 4.4 First Deployment Attempt ✅ SIGNIFICANT PROGRESS

**Initial Issue - Docker Hub Authentication:**
- ❌ VPS couldn't pull images: "pull access denied"
- ✅ Fixed by adding Docker login step to workflow

**Issue 1 - Port 80 Conflict:**
- ❌ Caddy couldn't start (port 80 already allocated)
- ✅ Resolved (Caddy now running for 6+ hours)

**Issue 2 - App Container Crash Loop:**
- ❌ App container was in restart loop
- ✅ Resolved (app now staying up)

**Issue 3 - Redis Client Compatibility:**
- ❌ Node Redis client incompatible with production environment
- ✅ Fixed by replacing with node-compatible ioredis client

**Current Status (Latest Deployment - Commit 31d383f):**
- [x] GitHub Actions workflow completes successfully
- [x] Images pushed to Docker Hub
- [x] VPS pulls images successfully
- [x] Code automatically pulled and updated on VPS
- ✅ **Running Healthy:** db, valkey, go, caddy, ofelia
- ✅ **Running:** app (web application up!)
- ⚠️ **Issue:** Nominatim restarting (likely still importing Argentina data)
- ⚠️ **Issue:** Migration failed (`error: Script not found "kysely"`)

**Services Status:**
```
production-app-1       Up 2 seconds
production-caddy-1     Up 6 hours (0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp)
production-db-1        Up 6 hours (healthy)
production-go-1        Up 11 seconds (healthy)
production-nominatim-1 Restarting (1) 52 seconds ago
production-ofelia-1    Up 6 hours
production-valkey-1    Up 6 hours (healthy)
```

**Latest Code Changes Deployed:**
- Updated `apps/web/app/lib/server/kv.server.ts` (Redis → ioredis)
- Updated `apps/web/package.json` (added ioredis dependency)
- Updated `apps/web/bun.lock`

### 4.5 Latest Deployment Status ✅ CI/CD FULLY WORKING

**Deployment Completed Successfully:**
- [x] GitHub Actions workflow executes without errors
- [x] Images built and pushed to Docker Hub
- [x] VPS pulls latest code from GitHub
- [x] VPS pulls latest Docker images
- [x] Migrations run successfully
- [x] Containers started and healthy
- [x] **App is serving HTTP requests with 200 status**

**Current Container Status:**
```
production-app-1       Up and healthy (serving requests on port 3000)
production-caddy-1     Up 24+ hours (healthy, redirecting HTTP→HTTPS)
production-db-1        Up 16+ hours (healthy)
production-go-1        Up and healthy
production-ofelia-1    Up 24+ hours (running)
production-valkey-1    Up 24+ hours (healthy)
production-nominatim-1 Restarting (importing Argentina data)
```

**App Verification:**
- ✅ Internal HTTP test: 200 OK
- ✅ HTML rendering correctly
- ✅ React Router serving pages
- ✅ Logs showing: `[react-router-serve] http://localhost:3000`
- ⏳ External access pending DNS configuration

### 4.6 Issues Fixed

**Issue 1: App Not Responding** ✅ RESOLVED
- [x] App container is running (process: `node ./build/server/index.js`)
- [x] Environment variables correct (PORT=3000, NODE_ENV=production)
- [x] Container status shows "Up" (not crashing)
- [x] **Root Cause:** Dockerfile was using `node ./build/server/index.js` instead of `react-router-serve`
- [x] **Solution:** Changed CMD to `bun run start` (which runs `react-router-serve`)
- [x] App now produces logs: `[react-router-serve] http://localhost:3000`
- [x] App responds with HTTP 200
- [x] HTML being served correctly
- **Status:** Application fully functional, serving requests

**Issue 2: Migration Script Error** ✅ RESOLVED
- [x] Migration fails with `error: Script not found "kysely"`
- [x] Fix package.json scripts (likely needs `kysely migrate:latest` script)
- [x] Verify migrations run successfully
- **Status:** Migrations now working correctly

**Issue 3: Nominatim Import** ⚠️ NON-BLOCKING
- [x] Nominatim container removed (not in current deployment)
- **Status:** No longer an issue (service not running)
- **Impact:** Geocoding features unavailable until Nominatim is configured

### 4.7 DNS Configuration ✅ COMPLETED

**App is now publicly accessible!**
- [x] Added A record: `habita.rent` → `209.38.143.22` (Proxied via Cloudflare)
- [x] Added CNAME: `www` → `habita.rent` (Proxied via Cloudflare)
- [x] DNS propagated successfully
- [x] Cloudflare handling SSL/TLS termination
- [x] App accessible at `https://habita.rent` ✅

**The app is LIVE in production! 🚀**

### 4.8 Future Deployments
**Every push to main automatically:**
1. Builds new images in GitHub Actions
2. Pushes to Docker Hub
3. Deploys to VPS
4. Runs migrations
5. Restarts services

**No manual intervention needed** ✅

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

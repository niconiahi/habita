# Production Environment Setup

How to provision and configure a production server from scratch. Use this when setting up a new server, migrating to a different provider, or replacing a failed machine.

---

## Prerequisites (Before Disaster Strikes)

You need these things backed up **before** the server dies:

| Item | Location | Have it? |
|------|----------|----------|
| age private key | KeePassXC | ⬜ |
| Database backups | R2 bucket / local | ⬜ |
| Git repo access | GitHub | ⬜ |
| Domain DNS access | Cloudflare / registrar | ⬜ |
| DockerHub access | hub.docker.com | ⬜ |

**If you don't have backups off-server, you cannot recover the database.** The rest can be rebuilt.

---

## Recovery Time Estimates

| Scenario | Time to Recover |
|----------|-----------------|
| Server dies, backups exist | 30-60 minutes |
| Server dies, no backups | Data is gone forever |
| Database corrupted, backups exist | 15-30 minutes |
| Accidentally deleted containers | 5 minutes |

---

## Step-by-Step Recovery

### Step 1: Don't Panic

Seriously. Take a breath. If you have backups, you'll be fine.

### Step 2: Provision New Server

**Hetzner (example):**
```
- Go to https://console.hetzner.cloud
- Create new server
- Ubuntu 22.04 or 24.04
- Choose same region as before (or closest to users)
- Add your SSH key
- Note the new IP address
```

**Minimum specs:**
- 2 vCPU
- 4GB RAM
- 40GB disk

### Step 3: Basic Server Setup

```bash
# SSH into new server
ssh root@NEW_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install just
curl -qL https://just.systems/install.sh | bash -s -- --to /usr/local/bin

# Install sops + age
curl -LO https://github.com/FiloSottile/age/releases/download/v1.2.0/age-v1.2.0-linux-amd64.tar.gz
tar xzf age-v1.2.0-linux-amd64.tar.gz
mv age/age age/age-keygen /usr/local/bin/

curl -LO https://github.com/getsops/sops/releases/download/v3.9.0/sops-v3.9.0.linux.amd64
chmod +x sops-v3.9.0.linux.amd64
mv sops-v3.9.0.linux.amd64 /usr/local/bin/sops

# Create app user (optional but recommended)
useradd -m -s /bin/bash habita
usermod -aG docker habita
su - habita
```

### Step 4: Clone Repository

```bash
# As habita user (or root)
cd ~
git clone https://github.com/YOUR_USER/habita.git
cd habita
```

### Step 5: Restore Secrets

Follow the "First-Time Setup > On the VPS" section in [`secrets.md`](secrets.md#first-time-setup) to install the age key from KeePassXC, then decrypt:

```bash
just --set env production secrets decrypt
```

### Step 6: Get Database Backup

**If backups are in R2:**
```bash
# Install rclone
curl https://rclone.org/install.sh | bash

# Configure rclone (paste your R2 credentials)
rclone config
# Choose: s3 → Cloudflare → enter credentials

# Download latest backup
rclone copy r2:habita-backups/postgres/ /tmp/backups/
ls -la /tmp/backups/  # find latest file
```

**If backups are local (you copied them somewhere):**
```bash
scp backup_20260118_030000.sql.gz root@NEW_IP:/tmp/
```

### Step 7: Start Database First

```bash
cd ~/habita
just --set env production network
docker compose -p storage -f infra/production/storage/docker-compose.yml up -d db
docker compose -p storage -f infra/production/storage/docker-compose.yml ps
```

### Step 8: Restore Database

Follow the restore procedure in [`recovery/backups.md`](recovery/backups.md#restore). Then verify:

```bash
docker exec -it storage-db-1 psql -U postgres -d habita -c "SELECT COUNT(*) FROM users;"
```

### Step 9: Start Everything Else

```bash
just --set env production up
```

### Step 10: Update DNS

Point your domain to the new server IP:

```
# In Cloudflare (or your DNS provider)
A    habita.rent    → NEW_IP
A    api.habita.rent → NEW_IP
```

DNS propagation takes 1-60 minutes depending on TTL.

### Step 11: Verify Everything Works

```bash
# Check all services running
just --set env production status

# Check logs for errors
just --set env production logs app

# Test the site
curl -I https://habita.rent

# Test database connectivity
just --set env production db
# Run: SELECT COUNT(*) FROM users;
```

---

## Recovery Checklist

Use this during an actual disaster:

```
[ ] New server provisioned
[ ] Docker installed
[ ] just, sops, age installed
[ ] Repository cloned
[ ] age private key restored
[ ] Secrets decrypted
[ ] Database backup downloaded
[ ] Database container started
[ ] Database restored from backup
[ ] All services started
[ ] DNS updated
[ ] Site responding
[ ] Logged in and verified data
[ ] Monitoring confirmed working
```

---

## Partial Failures

### Only database volume corrupted

1. `just --set env production down`
2. `docker volume rm storage_db`
3. `docker compose -p storage -f infra/production/storage/docker-compose.yml up -d db`
4. Restore from backup — see [`recovery/backups.md`](recovery/backups.md#restore)
5. `just --set env production up`

### Only application broken (database fine)

```bash
# Just restart or redeploy
just --set env production restart app

# Or deploy specific version
just --set env production deploy <known-good-sha>
```

### Lost SSH access but server is running

- Use Hetzner/DO console access
- Or request KVM access from provider
- Reset root password if needed

---

## What You'll Lose

Even with good backups, you'll lose:

1. **Data since last backup** — if backups run at 3am, you lose everything after 3am
2. **Uploaded files** — unless you backup the media volume too
3. **Logs** — historical logs are gone
4. **Cache** — Valkey data (usually fine to lose)

---

## Reducing Recovery Time

### Use infrastructure-as-code

Your current setup is already good — everything is in git.

### Automate server provisioning

Consider writing a setup script:
```bash
#!/bin/bash
# setup-server.sh
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
# ... etc
```

### Keep backups off-server

**This is critical.** If backups are on the same server that dies, they die too.

Current status: ⚠️ Your backups are local only.

### Document everything

You're doing this now. Good.

---

## Testing Your Disaster Recovery

Once a quarter, actually test this:

1. Spin up a fresh server
2. Follow this doc step-by-step
3. Verify you can restore from backup
4. Note anything that was confusing or missing
5. Update this doc
6. Tear down the test server

If you can't recover in a test, you can't recover in a real disaster.

---

## Emergency Contacts

| Service | How to Contact |
|---------|----------------|
| Hetzner | https://console.hetzner.cloud / support ticket |
| Cloudflare | https://dash.cloudflare.com |
| GitHub | https://github.com |
| DockerHub | https://hub.docker.com |

---

## Post-Recovery

After you're back online:

1. **Notify users** if there was data loss
2. **Check for data inconsistencies**
3. **Review what caused the failure**
4. **Improve backups** if needed (more frequent, off-server)
5. **Update this doc** with lessons learned

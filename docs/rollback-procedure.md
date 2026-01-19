# Rollback Procedure

When a deploy goes wrong, you need to go back to the previous working version. This doc covers how.

---

## What is a Rollback?

You deployed version B. It's broken. You want to go back to version A (which was working).

```
Timeline:
  v1.0 (working) → v1.1 (broken) → rollback to v1.0
```

---

## Types of Rollbacks

| Scenario | Difficulty | Method |
|----------|------------|--------|
| Bad application code | Easy | Redeploy previous image |
| Bad environment variable | Easy | Revert .env, restart |
| Bad database migration | Hard | Restore from backup |
| Bad infrastructure change | Medium | Git revert, redeploy |

---

## 1. Rolling Back Application Code

This is the most common case. You pushed bad code, the new image is broken.

### Find the previous working image

```bash
# List recent images on DockerHub
docker pull niconiahi/habita:svelte-latest
docker images niconiahi/habita --format "{{.Tag}} {{.CreatedAt}}" | head -10

# Or check your GitHub Actions history for the commit SHA
# https://github.com/YOUR_USER/habita/actions
```

Every push to `main` creates an image tagged with the git SHA:
```
niconiahi/habita:svelte-abc123f   ← commit abc123f
niconiahi/habita:svelte-def456a   ← commit def456a (previous)
niconiahi/habita:svelte-latest    ← always points to newest
```

### Deploy the previous version

```bash
# SSH into production server
ssh user@your-server
cd habita

# Deploy specific version (replace with actual SHA)
just --set env production deploy def456a
```

This pulls and restarts only the svelte container with the old image.

### Verify it's working

```bash
# Check container is running
just --set env production status

# Check logs for errors
just --set env production logs app

# Hit the app and verify
curl -I https://habita.rent
```

### After stabilizing

1. Fix the bug in your code
2. Push to main (creates new image)
3. Deploy the fix: `just --set env production deploy <new-sha>`

---

## 2. Rolling Back Environment Variables

You changed a secret or config value and broke something.

### If you remember the old value

```bash
# SSH into server
ssh user@your-server
cd habita

# Edit the encrypted secrets
just --set env production secrets-edit
# Fix the value, save, exit

# Restart the affected service
just --set env production restart app
```

### If you don't remember the old value

Check git history for the encrypted file:
```bash
# See recent changes to production secrets
git log --oneline -10 -- infra/production/.env.enc

# Show the diff
git show <commit>:infra/production/.env.enc > /tmp/old.env.enc

# Decrypt the old version to see values
sops -d --input-type dotenv --output-type dotenv /tmp/old.env.enc
```

Or restore the entire file:
```bash
# Restore .env.enc from specific commit
git checkout <commit> -- infra/production/.env.enc

# Decrypt it
just --set env production secrets-decrypt

# Restart
just --set env production restart app
```

---

## 3. Rolling Back Database Migrations

**This is the hardest rollback.** Database changes can't be "undeployed" like code.

### Option A: The migration is reversible

If your migration has a `down` function:
```bash
# SSH into server
ssh user@your-server
cd habita

# Run migration rollback (adjust command for your setup)
docker exec app-svelte-1 bun run db:rollback
```

### Option B: Restore from backup

If the migration corrupted data or isn't reversible:

```bash
# 1. Stop the application (prevent further writes)
just --set env production down

# 2. Find a backup from before the migration
ls -la /var/lib/docker/volumes/app_backups/_data/
# Or check your R2 bucket

# 3. Restore the backup
docker exec -i app-db-1 psql -U postgres -d habita < backup_20260118_030000.sql

# 4. Deploy the OLD code version (before the migration)
just --set env production deploy <old-sha>

# 5. Start everything
just --set env production up
```

### Prevention is better than cure

- Always backup before running migrations
- Test migrations on a copy of production data first
- Make migrations reversible when possible
- Deploy code and migrations separately when risky

---

## 4. Rolling Back Infrastructure Changes

You changed docker-compose.yml, Caddyfile, or other infra config.

### Revert the git commit

```bash
# Find the bad commit
git log --oneline -10

# Revert it
git revert <bad-commit>
git push

# On server: pull and restart
ssh user@your-server
cd habita
git pull
just --set env production down
just --set env production up
```

### Or checkout specific files

```bash
# Revert just the docker-compose file
git checkout <good-commit> -- infra/production/app/docker-compose.yml
git commit -m "revert: docker-compose changes"
git push
```

---

## Quick Reference

### "App is broken after deploy"
```bash
just --set env production deploy <previous-sha>
```

### "Changed a secret and broke things"
```bash
just --set env production secrets-edit  # fix it
just --set env production restart app
```

### "Database is corrupted"
```bash
just --set env production down
# restore backup
just --set env production deploy <old-sha>
just --set env production up
```

### "Everything is on fire"
```bash
# Nuclear option: go back to last known good state
just --set env production down
git checkout <last-known-good-commit>
just --set env production secrets-decrypt
just --set env production up
```

---

## Finding Previous Versions

### Git commits
```bash
git log --oneline -20
```

### Docker images
```bash
# Locally
docker images niconiahi/habita

# On DockerHub
# https://hub.docker.com/r/niconiahi/habita/tags
```

### GitHub Actions
```bash
# See all builds
# https://github.com/YOUR_USER/habita/actions
```

---

## Post-Rollback Checklist

After any rollback:

- [ ] Verify the app is working (hit key endpoints)
- [ ] Check logs for errors: `just --set env production logs app`
- [ ] Notify team/users if there was downtime
- [ ] Create a ticket to investigate the root cause
- [ ] Document what went wrong and how you fixed it

---

## Prevention

1. **Always have a backup before risky changes**
2. **Deploy during low-traffic hours**
3. **Test in development first** (obvious but often skipped)
4. **Keep previous images available** — don't prune too aggressively
5. **Small, frequent deploys** — easier to rollback than big releases

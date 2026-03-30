# Database Backups

## How It Works

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

---

## Manual Backup

```bash
# Development (unencrypted)
just backup

# Production (encrypted) — run on VPS
just --set env production backup
```

---

## Restore

### From R2 (production backups)

```bash
# 1. Download from R2
rclone copy r2:habita-backup/postgres/habita_20240115_030000.sql.gz.age ./

# 2. Decrypt
age -d -i ~/.config/sops/age/keys.txt habita_20240115_030000.sql.gz.age > backup.sql.gz

# 3. Decompress
gunzip backup.sql.gz

# 4. Restore
psql -U $POSTGRES_USER -d $POSTGRES_DB < backup.sql
```

### From local backups (development)

```bash
# Find available backups
ls -la /var/lib/docker/volumes/storage_backups/_data/

# Decompress and restore
gunzip -c backup.sql.gz | docker exec -i storage-db-1 psql -U postgres -d habita
```

---

## Restore Testing

Run monthly to verify backups are valid:

```bash
just restore-test

# Or test a specific backup file
just restore-test backups/habita_20240101_030000.sql.gz.age
```

This will:
1. Find the latest encrypted backup
2. Create a temporary test database
3. Decrypt and restore the backup
4. Run sanity checks (table counts)
5. Clean up the test database

# Testing Jobs Plan

Testing plan for the period price escalation job system.

## Prerequisites

### Seed Data Setup
The seed file creates:
- **2 Rate records**:
  - IPC for current month: value 1.21
  - IPC for 3 months ago: value 1.1
- **1 Active contract** with escalation settings:
  - State: ACTIVE
  - Escalation type: IPC (0)
  - Escalation duration: P3M (3 months)
  - Started: 6 months ago
- **2 Periods**:
  - Period 1: 6 months ago → 3 months ago, price 600000
  - Period 2: 3 months ago → yesterday, price 600000

**Expected Result**: Contract is due for escalation. New period should be created with price: 600000 × (1.21 / 1.1) = **660,000**

---

## Phase 1: Manual Script Testing

Test the scripts directly without cron/docker.

### Step 1.1: Test Job Creation Script
```bash
cd /Users/niconiahi/Documents/repos/habita
bun run apps/web/app/lib/server/cron/create_escalation_jobs.script.ts
```

**Expected output**:
```
starting escalation job creation
found 1 active contracts with due periods
created escalation job
escalation job creation completed: 1 jobs created
```

**Verify in DB**:
```sql
SELECT * FROM job WHERE type = 'calculate_escalation';
-- Should show 1 pending job with empty payload
```

### Step 1.2: Test Job Processing Script
```bash
bun run apps/web/app/lib/server/cron/process_jobs.script.ts
```

**Expected output**:
```
starting job processing
processing 1 pending jobs
job 1: processed 1 contracts, 0 failed
Job 1 completed successfully
Job processing complete
job processing completed successfully
```

**Verify in DB**:
```sql
-- Job should be marked as fulfilled
SELECT * FROM job WHERE type = 'calculate_escalation';

-- New period should exist with escalated price
SELECT * FROM period ORDER BY created_at DESC LIMIT 1;
-- price should be ~660000

-- Formula parameters should exist
SELECT * FROM formula_parameter WHERE period_id = (SELECT id FROM period ORDER BY created_at DESC LIMIT 1);
-- Should show 2 records: rate_current and rate_past
```

---

## Phase 2: Ofelia Docker Cron Testing

Test that Ofelia correctly schedules and runs the jobs.

### Step 2.1: Configure Test Schedules

**File**: `infra/development/ofelia.ini`

Both jobs set to run every 1 minute:
```ini
schedule = 0 * * * * *
```

**Note**: These are TEST schedules. Production will use:
- create-escalation-jobs: daily at midnight (`0 0 0 * * *`)
- process-jobs: every hour (`0 0 * * * *`)

### Step 2.2: Start Docker Services
```bash
cd infra/development
docker-compose up -d
```

### Step 2.3: Watch Ofelia Logs
```bash
docker-compose logs -f ofelia
```

**Expected behavior** (every minute):
1. create-escalation-jobs runs → creates job if contracts are due
2. process-jobs runs → processes pending jobs

### Step 2.4: Watch App Logs
```bash
docker-compose logs -f app
```

Look for:
- "found X active contracts with due periods"
- "created escalation job"
- "processing X pending jobs"
- "job X: processed X contracts, X failed"

### Step 2.5: Verify Job Execution
```bash
# Check that ofelia container is running
docker-compose ps

# Verify jobs are executing (check timestamps)
docker-compose exec app sh -c "ls -la /app/app/lib/server/cron/"
```

---

## Troubleshooting

### Jobs not creating
- Check if contract actually has `end_date <= today`
- Verify rates exist for current month and 3 months ago
- Check contract state is ACTIVE (1)

### Jobs failing
- Check app logs: `docker-compose logs app`
- Check failed_job table: `SELECT * FROM failed_job`
- Verify database connectivity

### Ofelia not running jobs
- Check ofelia logs: `docker-compose logs ofelia`
- Verify container names match ofelia.ini (should be `development-app-1`)
- Check docker socket is mounted: `docker-compose exec ofelia ls -la /var/run/docker.sock`

### No overlap working?
- If job is still running when next cron fires, it should skip
- Check ofelia logs for "Skipped job" messages

---

## Success Criteria

- ✅ Seed creates test contract with due escalation
- ✅ Manual scripts run without errors
- ✅ New period created with correct price (660,000)
- ✅ Formula parameters stored correctly
- ✅ Job marked as fulfilled in database
- ✅ Ofelia executes jobs every minute
- ✅ No duplicate jobs created (idempotency works)
- ✅ Failed jobs move to failed_job table (can test by breaking something)

---

## Cleanup

After testing, to reset:
```bash
# Reset database
bun run db:migrate

# Re-seed
bun run db:seed

# Restart docker
cd infra/development
docker-compose restart
```

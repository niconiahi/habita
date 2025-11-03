# Period Price Automated Calculation

Automatic contract price escalation based on IPC/ICL indices with job queue infrastructure.

## Context

Contracts have escalation settings (`escalation_type`, `escalation_duration`) that define when and how rent prices should increase. This system automates:
- Manual entry of monthly index values (IPC, ICL, etc.) via webmaster UI
- Automatic calculation of new period prices using stored indices
- Job queue with manual retry for failed calculations
- Cron-based scheduling via Ofelia Docker image

## Example Flow

Contract starts 01-01-2024 with 4-month escalation using IPC:
- 01-01-2024: price 600000
- 01-02-2024: price 600000
- 01-03-2024: price 600000
- 01-04-2024: price 600000
- 01-05-2024: price 728000 (calculated: 600000 × IPC_05_2024 / IPC_01_2024)

---

## Phase 1: Job Queue Infrastructure

Database tables for job management and failure tracking.

### Tasks

- [x] Create migration `add_job_tables.ts`
  - [x] `job` table schema
    - `id` (serial primary key)
    - `type` (varchar, e.g., 'calculate_escalation')
    - `payload` (jsonb, stores job-specific data)
    - `status` (varchar: 'pending', 'in_progress', 'completed', 'failed')
    - `scheduled_at` (timestamp, when to run)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)
  - [x] `failed_job` table schema
    - `id` (serial primary key)
    - `job_id` (integer, references job.id)
    - `error_message` (text)
    - `error_stack` (text, full stack trace)
    - `attempt_count` (integer, default 1)
    - `failed_at` (timestamp)
    - `created_at` (timestamp)

- [x] Update `apps/web/db/types.ts` with new table types
  - [x] Add `Job` interface
  - [x] Add `FailedJob` interface
  - [x] Types auto-generated via kysely-codegen

---

## Phase 2: Index Value Storage + Webmaster UI

Store monthly index values and provide admin interface for data entry.

### Tasks

- [x] Create migration `add_rate.ts`
  - [x] `rate` table schema
    - `id` (serial primary key)
    - `type` (integer, RATE_TYPE: 0=IPC, 1=ICL, 2=CasaPropia, 3=CAC, 4=CER, 5=IS, 6=IPIM, 7=UVA)
    - `month` (integer, 1-12)
    - `year` (integer)
    - `value` (numeric)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)
  - [x] Unique constraint: `rate_type_month_year_unique` on `(type, month, year)`

- [x] Update `apps/web/db/types.ts` via kysely-codegen

- [x] Create `apps/web/app/lib/server/rate_type.ts`
  - [x] RATE_TYPE constants (IPC, ICL, CasaPropia, CAC, CER, IS, IPIM, UVA)
  - [x] get_rate_label() function

- [x] Create `apps/web/app/lib/server/auth.ts` helpers
  - [x] Implement `is_webmaster(user)` function
    - Check if `user.email === "nicolas.accetta@gmail.com"`
    - Return boolean

- [x] Create route `/admin/rates`
  - [x] File: `apps/web/app/routes/admin+/rates+/_index.tsx`
  - [x] Loader: fetch current month/year rate values
  - [x] Auth: `require_auth()` + `is_webmaster()` check (403 if not webmaster)
  - [x] UI: List all 8 rate types with input + save button per rate
    - Display input field for each rate
    - Save button per rate
    - Pre-fill if value exists for current month
    - Use `navigate={false}` to prevent URL change
  - [x] Action: upsert rate
    - Parse `type`, `month`, `year`, `value` from FormData
    - Validate using Valibot with v.pipe(ForceNumberSchema, RateTypeSchema)
    - Upsert into `rate` table using onConflict
    - Return null

---

## Phase 3: Escalation Calculation Logic

Core business logic for calculating new period prices. Uses batch processing for efficiency.

### Tasks

- [x] Create `apps/web/app/lib/server/get_next_period_price.ts` (single contract version)
  - [x] Query ACTIVE contract with escalation config
  - [x] Get last period where end_date <= today (SQL-level validation)
  - [x] Calculate months offset from duration
  - [x] Lookup current and past rate values
  - [x] Calculate new price: `prev_price × (rate_current / rate_past)`
  - [x] Create new period + formula_parameter records in transaction

- [x] Refactor to `calculate_all_due_escalations()` (batch version)
  - [x] Single query: get ALL ACTIVE contracts with due periods
    - Join contract + period
    - Filter: state=ACTIVE, end_date<=today, escalation config present
    - Use distinctOn to get latest period per contract
  - [x] Batch fetch all needed rates
    - Collect all unique (type, month, year) combinations
    - Single query to fetch all rates at once
  - [x] Calculate prices for all contracts
    - Loop through contracts, calculate new prices
    - Build array of new periods + formula_parameters
  - [x] Batch insert in single transaction
    - Insert all new periods at once
    - Insert all formula_parameters at once
  - [x] Return summary: { processed: number, failed: number }

---

## Phase 4: Job Processing Infrastructure

Job orchestration that executes pending jobs using the calculation logic.

### Tasks

- [x] Create `apps/web/app/lib/server/cron/process_jobs.ts`
  - [x] Function: `process_jobs()`
    - [x] Query pending jobs ordered by scheduled_at
    - [x] For each job:
      - [x] Try:
        - [x] Switch on job_type
          - [x] Case 'calculate_escalation':
            - Call `calculate_all_due_escalations()`
        - [x] Update job status to 'fulfilled'
      - [x] Catch error:
        - [x] Insert into `failed_job` table
          - Store job_id, error_message, error_stack
          - Set attempt_count = 1
        - [x] Update job status to 'failed'
        - [x] Log error to stdout

- [x] Create executable script `apps/web/app/lib/server/cron/process_jobs.script.ts`
  - [x] Import and call `process_jobs()`
  - [x] Handle top-level errors
  - [x] Exit with proper code (0 = success, 1 = error)

---

## Phase 5: Job Creation

Daily job that identifies contracts needing escalation and creates job records.

### Tasks

- [x] Create `apps/web/app/lib/server/cron/create_escalation_jobs.ts`
  - [x] Function: `create_escalation_jobs()`
    - [x] Query active contracts
      - [x] Join with latest period
      - [x] Where: `contract.state = ACTIVE`
      - [x] Where: `last_period.end_date <= TODAY`
    - [x] For each contract:
      - [x] Check if job already exists (pending) for this contract
      - [x] If not, insert into `job` table
        - `job_type = 'calculate_escalation'`
        - `payload = { contract_id: contract.id }`
        - `status = 'pending'`
        - `scheduled_at = NOW()`
    - [x] Log count of jobs created

- [x] Create executable script `apps/web/app/lib/server/cron/create_escalation_jobs.script.ts`
  - [x] Import and call `create_escalation_jobs()`
  - [x] Handle errors
  - [x] Exit with proper code

- ~~Create manual test helper `preview_escalation_jobs.ts`~~ (eliminated - not needed)

---

## Phase 6: Ofelia Docker Cron Integration

Configure Ofelia to run cron jobs in Docker environment.

### Tasks

- [x] Create `infra/development/ofelia.ini` configuration file
  - [x] Job 1: Create escalation jobs
    - Schedule: `0 0 * * * *` (midnight UTC daily)
    - Command: `bun run /app/app/lib/server/cron/create_escalation_jobs.script.ts`
    - Container: development-app-1
    - No-overlap: true
  - [x] Job 2: Process jobs
    - Schedule: `0 * * * * *` (every hour)
    - Command: `bun run /app/app/lib/server/cron/process_jobs.script.ts`
    - Container: development-app-1
    - No-overlap: true

- [x] Update `infra/development/docker-compose.yml`
  - [x] Add `ofelia` service
    - Image: `mcuadros/ofelia:latest`
    - Depends on: `app`
    - Volumes:
      - `/var/run/docker.sock:/var/run/docker.sock:ro`
      - `./ofelia.ini:/etc/ofelia/config.ini:ro`
    - Command: `daemon --config /etc/ofelia/config.ini`

- [ ] Test locally (when ready)
  - [ ] `docker-compose up -d`
  - [ ] Verify ofelia container running
  - [ ] Check ofelia logs: `docker-compose logs -f ofelia`
  - [ ] Verify jobs execute on schedule

Note: Production ofelia configuration will be added later, then common pieces extracted to shared

---

## Phase 7: Manual Failed Job Retry

Manual retry of failed jobs via webmaster UI button click.

### Tasks

- [ ] Create route `/admin/jobs/retry`
  - [ ] File: `apps/web/app/routes/admin+/jobs+/retry/index.tsx`
  - [ ] Auth: `require_auth()` + `is_webmaster()` check
  - [ ] Loader: fetch all failed jobs
    - Display: job_id, job_type, error_message, attempt_count, failed_at
  - [ ] Action: `retry_failed_jobs`
    - [ ] Query all failed_jobs
    - [ ] For each failed job:
      - [ ] Start transaction
        - [ ] Update original job: status = 'pending', scheduled_at = NOW()
        - [ ] Delete from failed_job table
      - [ ] Commit transaction
    - [ ] Return count of jobs retried
  - [ ] UI:
    - [ ] List of failed jobs with details
    - [ ] "Retry All Failed Jobs" button
    - [ ] Success message showing count retried

---

## Testing Checklist

- [ ] Phase 1: Job tables
  - [ ] Run migration, verify tables exist
  - [ ] Manually insert test job, verify types work

- [ ] Phase 2: Index UI
  - [ ] Login as webmaster, access `/admin/rates`
  - [ ] Non-webmaster cannot access (403)
  - [ ] Save IPC value for current month
  - [ ] Verify stored in database

- [ ] Phase 3: Calculation logic
  - [ ] Run unit tests: `bun test get_next_price.test.ts`
  - [ ] Create test contract with escalation settings
  - [ ] Add periods and index values
  - [ ] Manually call `get_next_price()` to verify behavior
  - [ ] Verify new period created with correct price

- [ ] Phase 4: Job processing
  - [ ] Run `process_jobs` script manually
  - [ ] Create test pending job in database
  - [ ] Verify job status changes to fulfilled on success
  - [ ] Verify job status changes to failed on error

- [ ] Phase 5: Job creation
  - [ ] Call `preview_escalation_jobs()` to see which contracts would be affected
  - [ ] Run `create_escalation_jobs` script
  - [ ] Verify jobs created for due contracts
  - [ ] Verify no duplicate jobs

- [ ] Phase 6: Ofelia
  - [ ] Check ofelia container logs
  - [ ] Verify jobs run on schedule
  - [ ] Verify no-overlap prevents concurrent runs

- [ ] Phase 7: Manual Retries
  - [ ] Create failing job (e.g., missing index)
  - [ ] Verify moved to failed_job
  - [ ] Access `/admin/jobs/retry` as webmaster
  - [ ] Click "Retry All Failed Jobs"
  - [ ] Verify jobs reset to pending status

---

## Notes

- All cron times in UTC
- Cron schedules configured in `ofelia.ini` files (not docker-compose.yml)
- Periods must be consecutive (no gaps)
- Missing index data blocks calculation (doesn't skip)
- Failed jobs retry manually via webmaster UI (not automatic)
- Job statuses mirror Promise states: 'pending', 'fulfilled', 'failed' (no 'in_progress')
- Webmaster email hardcoded: nicolas.accetta@gmail.com
- Follow Ruby/senior-devops error handling patterns (log to stdout)
- Phase 3 includes comprehensive unit tests for calculation logic
- Phase 4 is job processing infrastructure (separate from calculation logic)
- Phase 5 includes preview function to test job creation without side effects
- Contract activation deferred to digital signature implementation

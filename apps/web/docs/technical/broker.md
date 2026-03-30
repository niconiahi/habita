# Message Broker

## The problem we're solving

Habita's job system used Postgres tables (`job`, `failed_job`) with an Ofelia cron polling loop (`process_jobs.ts`) that ran every minute, fetched PENDING jobs, and processed them sequentially. This had several problems:

1. **No retry mechanism.** When a job failed, it was inserted into `failed_job` with `attempt_count=1` and never retried. The failed row sat in the table forever.
2. **No dead letter queue.** There was no way to inspect, replay, or alert on failed jobs other than querying the `failed_job` table and reading logs.
3. **Sequential processing.** One failure in the loop could affect subsequent jobs. If job #37 threw an uncaught exception, jobs #38-100 didn't run until the next minute.
4. **No isolation.** All three job types were processed by the same polling loop. A slow escalation calculation blocked reminder emails.
5. **Polling-based.** The cron ran every minute regardless of whether work existed.

The fundamental issue: Postgres is a database, not a job queue. We were building retry logic, deduplication, failure tracking, and dispatch routing on top of a system that has none of these primitives. A message broker has all of them built in.

## Why Redpanda

Redpanda is a Kafka-compatible message broker. It speaks the exact same protocol as Kafka — the `kafkajs` client library connects to it without knowing the difference. The reason to use Redpanda over Kafka:

- **Single binary.** Kafka runs on the JVM and historically required ZooKeeper. Redpanda is written in C++ — one binary, no JVM.
- **Lower resource usage.** Kafka's JVM baseline is ~1.5GB of RAM. Redpanda runs comfortably at 512MB.
- **Simpler configuration.** Kafka requires 15+ environment variables. Redpanda needs 3 flags.
- **Built-in web console.** Kafka needs a separate container to inspect topics. Redpanda includes a console.
- **Identical application code.** Switching between them is a Docker image change. No code changes.

We chose Redpanda over simpler alternatives (BullMQ, pgboss) because the explicit control over message flow, retries, and dead-letter routing was preferred over library magic. With BullMQ or pgboss, retry and DLQ behavior is configured through library options and handled internally. With Kafka/Redpanda, the application code explicitly re-publishes failed messages, increments retry headers, and routes to DLQ topics. Every step is visible in the code and in the broker's topic inspection UI.

The tradeoff: more verbose application code. But those lines are debuggable, observable, and behave exactly as written — there's no library behavior to discover in docs when things go wrong at 2 AM.

## Architecture

The system has three roles: **producers**, **consumers**, and **events**.

```
Producers                                Broker (Redpanda)                        Consumers
┌──────────────────────────┐     ┌──────────────────────────────────┐     ┌──────────────────────────┐
│                          │     │                                  │     │                          │
│  Cron (8 AM)             │────▶│  send_renewal_reminder           │────▶│  Business logic handler  │
│  create_renewal_jobs.ts  │     │                                  │     │  (queries DB, sends      │
│                          │     │                                  │     │   emails internally)     │
│  Cron (every min)        │────▶│  calculate_escalation            │────▶│                          │
│  create_escalation_      │     │                                  │     │                          │
│  jobs.ts                 │     │                                  │     │                          │
│                          │     │                                  │     │                          │
│  MercadoPago webhook     │────▶│  extend_subscription             │────▶│                          │
│                          │     │                                  │     │                          │
│  User actions            │────▶│  send_booking_confirmation       │────▶│  Email delivery handler  │
│  (booking, signing,      │     │  send_signing_request            │     │  (receives composed      │
│   landlord invite)       │     │  send_landlord_invite            │     │   content, calls Go      │
│                          │     │                                  │     │   SMTP service)          │
│                          │     │  *.dlq (one per topic)           │     │                          │
└──────────────────────────┘     └──────────────────────────────────┘     └──────────────────────────┘
```

**Producers** publish messages to topics. Some are cron scripts that scan for work and publish a signal. Others are user-triggered actions that compose email content and publish the full payload. The MercadoPago webhook publishes on approved payments.

**Consumers** are a single long-lived Node process that subscribes to all topics and dispatches to the appropriate handler. The consumer runs as its own Docker service, separate from the SvelteKit app.

**Events** are the contract between producers and consumers. Each event is defined in its own file with a Valibot schema and a topic name constant. Both sides import from the same file — if the schema changes, both sides see it at compile time.

## Two categories of topics

### Business logic topics

These topics carry a signal or a reference ID. The consumer queries the database and executes business logic.

| Topic                   | Trigger                                   | Payload                       | Consumer does                                                       |
| ----------------------- | ----------------------------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `extend_subscription`   | MercadoPago webhook (approved payment)    | `{ subscription_payment_id }` | Looks up org, extends all seats by 1 month                          |
| `calculate_escalation`  | Cron (every minute, if contracts are due) | `{}`                          | Calls `calculate_all_due_escalations()`                             |
| `send_renewal_reminder` | Cron (8 AM daily, if orgs are expiring)   | `{}`                          | Calls `send_renewal_reminder()` which queries and emails internally |

### Email delivery topics

These topics carry fully composed email content. The producer (the action that has all the business context) builds the email subject, body, and recipient list. The consumer is a dumb delivery pipe — it validates the payload and calls the Go SMTP service. No database queries, no business logic.

| Topic                       | Trigger                                  | Payload                                                          | Consumer does                                      |
| --------------------------- | ---------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| `send_booking_confirmation` | User books a visit slot                  | `{ visitant, host, subject, visitant_text, host_text, content }` | Sends 2 emails (visitant + host with ICS calendar) |
| `send_signing_request`      | Admin sends contract for digital signing | `{ recipients, subject, html }`                                  | Sends HTML email to each recipient                 |
| `send_landlord_invite`      | Admin invites landlord to property       | `{ email, subject, html }`                                       | Sends HTML email to landlord                       |

This separation exists because the concerns are different. Business logic topics need database access and domain knowledge. Email topics need none — the producer already computed everything. The consumer just delivers.

### Why producers compose email content

The producer has all the context: the user who triggered the action, the data that was just queried, the URLs that were just generated. If the consumer had to reconstruct this from an ID, it would re-query the database, re-compose the HTML, and duplicate the business logic that the producer already has. Instead, the message carries the final email — inspectable in Redpanda Console, self-contained, and the consumer is trivially simple.

## Email delivery flow

All email sending flows through a single path:

```
Action (SvelteKit)                    Broker                     Consumer                Go service
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────┐     ┌──────────────┐
│ Queries DB      │     │                      │     │ Validates payload│     │              │
│ Composes email  │────▶│  topic: send_*       │────▶│ Calls send_email │────▶│ /send-email  │
│ Publishes event │     │                      │     │ Retries/DLQ      │     │ SMTP relay   │
└─────────────────┘     └──────────────────────┘     └──────────────────┘     └──────────────┘
```

The Go service (`go:8081/send-email`) is a pure SMTP relay. It accepts a JSON body with `{ type, to, subject, text?, html?, content? }` and delivers via SMTP/STARTTLS. It has zero business logic — it doesn't know what a subscription is, what a booking is, or who a landlord is. It receives composed content and sends it. All email types (calendar invites, HTML emails) go through this single endpoint, routed by the `type` field.

## Retry and dead letter queue

All consumer handlers share retry infrastructure from `broker/consumer/retry.ts`:

- `get_retry_count(headers)` — extracts the current retry count from message headers
- `with_incremented_retry(headers, count)` — returns headers with incremented retry count
- `with_failure_reason(headers, reason)` — returns headers with failure reason for DLQ
- `MAX_RETRIES` — constant (3), single source of truth

The pattern for every handler:

1. Parse the message value as JSON
2. Validate with `v.safeParse` against the event schema
3. If validation fails: publish to DLQ immediately (malformed message, no retry)
4. If validation passes: execute the work
5. If execution fails and retry count < `MAX_RETRIES`: re-publish with incremented retry header
6. If execution fails and retry count >= `MAX_RETRIES`: publish to DLQ with failure reason header

Email delivery handlers share a further abstraction: `deliver_email(payload, producer, sendFunction)`. This wraps the retry/DLQ pattern around any async send function, so email handlers are thin — they validate the payload, then call `deliver_email` with a closure that calls `send_email()`.

The DLQ is a regular topic. Messages can be inspected in the Redpanda Console, manually replayed by publishing them back to the original topic, or consumed by a dedicated DLQ handler (not implemented — inspected manually for now).

## Idempotency

Kafka/Redpanda guarantees at-least-once delivery — a message will be delivered, but might be delivered more than once (consumer crash before offset commit, consumer group rebalance, broker restart). Every consumer handler must be safe to run twice on the same message.

Every producer attaches a `message-id` header at publish time. The key is **deterministic** — derived from the business context, not random. This means the same logical event always produces the same key, whether the duplicate comes from the broker (redelivery) or the producer (double-publish). One mechanism handles both.

### Deterministic keys

| Topic                       | Key composition                   | Example lock key                        |
| --------------------------- | --------------------------------- | --------------------------------------- |
| `extend_subscription`       | `subscription_payment_id`         | `lock:extend_subscription:99`           |
| `calculate_escalation`      | today's date                      | `lock:calculate_escalation:2026-03-24`  |
| `send_renewal_reminder`     | today's date                      | `lock:send_renewal_reminder:2026-03-24` |
| `send_booking_confirmation` | `slot_id`                         | `lock:send_booking_confirmation:42`     |
| `send_signing_request`      | `contract_id`                     | `lock:send_signing_request:15`          |
| `send_landlord_invite`      | `property_id:invitation_token_id` | `lock:send_landlord_invite:44:7`        |

Keys must never contain PII (emails, names, phone numbers). Use opaque IDs or hashes instead. The landlord invite uses `invitation_token_id` (an integer from the DB insert that happens before publishing) rather than the landlord's email.

Date-based keys (`2026-03-24`) naturally limit cron-triggered topics to one processed execution per day, even if the cron fires multiple times.

### How it works

```
Producer publishes with message-id: "99"
  → header: { "message-id": "99" }

Consumer receives message:
  1. Read message-id from header → "99"
  2. Check lock:extend_subscription:99 → not set
  3. Execute work
  4. Set lock:extend_subscription:99 with 24h TTL

Duplicate delivery (broker redelivery OR producer double-publish):
  1. Read message-id from header → "99" (same key)
  2. Check lock:extend_subscription:99 → set
  3. Skip
```

The lock lives in Valkey with a 24-hour TTL. Valkey persists to disk — the lock survives container restarts.

For `calculate_escalation`, idempotency is also inherent in the business logic — once a contract's period is processed, it's no longer "due." The Valkey lock is an additional guard.

### Why not random UUIDs?

A random UUID only protects against **broker redelivery** (same message delivered twice). It does not protect against **producer duplicates** (same intent published twice with different UUIDs). Deterministic keys protect against both, because the same business event always produces the same key regardless of how many times the producer fires.

## Naming conventions

The codebase uses technology-agnostic names:

| Concept                | Name                  | Not                     |
| ---------------------- | --------------------- | ----------------------- |
| Broker infrastructure  | `infra/{env}/broker/` | `redpanda/`, `kafka/`   |
| All broker code        | `$lib/server/broker/` | `$lib/server/redpanda/` |
| Broker address env var | `BROKER_BROKERS`      | `REDPANDA_BROKERS`      |
| Topic names            | `snake_case`          | `kebab-case`            |

The `kafkajs` import is contained to two files: `broker/producer/client.ts` and `broker/consumer/consumer.script.ts`. Everything else speaks in terms of `publish_*`, `handle_*`, and event schemas. If the broker technology changes, two files change.

No magic numbers or strings in consumer handlers. All retry constants and header keys live in `broker/consumer/retry.ts`. This is enforced by the coding guidelines skill.

## Infrastructure

### Docker

Redpanda runs as its own compose project at `infra/{env}/broker/docker-compose.yml`:

- **Development**: Redpanda broker + Redpanda Console (web UI on `:8090`)
- **Production**: Redpanda broker only (no console)

Both are on the `internal` network. The Justfile includes `broker` in `up`, `down`, and `status` commands.

The consumer runs as a service in the `app` compose project alongside `svelte`. It uses the same image as the SvelteKit app but runs a different entry point (`broker/consumer/consumer.script.ts`). It has its own `OTEL_SERVICE_NAME: consumer` for observability separation. Storage services (`db`, `kv`) run in the separate `storage` compose project.

### Topic creation

Topics are created by `broker/consumer/create_topics.script.ts` using the `kafkajs` Admin API. The script is idempotent — it skips topics that already exist. It creates 12 topics total (6 main + 6 DLQ). All topics use 1 partition and replication factor 1.

### Cron schedule

The Ofelia cron schedule is unchanged:

- `create-escalation-jobs`: every minute — scans for due contracts, publishes `calculate_escalation` if found
- `create-renewal-jobs`: daily at 8 AM — scans for expiring subscriptions, publishes `send_renewal_reminder` if found (with Valkey lock dedup)

The `process-jobs` cron is removed. The consumer handles dispatch.

### Go email service

The Go service at `go:8081` has a single `/send-email` endpoint that accepts all email types. It routes by the `type` field: `"html"` for HTML emails, default for calendar invites with ICS attachments. The service is a pure SMTP relay — it receives fully composed content and delivers via SMTP/STARTTLS. No business logic, no database access, no per-email-type endpoints.

## What was removed

- `job`, `failed_job`, `job_subscription_payment` tables — replaced by broker topics and DLQ
- `job_type.ts`, `job_status.ts` enums — replaced by topic name constants
- `process_jobs.ts` and `process_jobs.script.ts` — replaced by the consumer's `eachMessage` dispatch
- `process-jobs` Ofelia cron — consumer is always running
- `/send-landlord-invite` Go endpoint — normalized into `/send-email` with `type: "html"`
- `SEND_LANDLORD_INVITE_ERROR` typed error — email errors now handled by consumer retry/DLQ
- `/demo` route — unused, removed during broker migration
- Direct `send_email()` calls in actions — replaced by broker publish calls

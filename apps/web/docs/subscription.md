# Subscription & Paywall

## The problem we're solving

Habita needs to monetize. Users currently sign up, pick an account type (freelance or realtor), and use everything for free. We need a paywall that charges monthly, gives a free trial, and gracefully degrades when payment lapses — rather than abruptly locking users out.

## Pricing model

Two account types, two pricing structures:

- **Freelance manager** (personal account): $50/month. One subscription row, one user.
- **Realtor organization** (with employees): $40/seat/month per manager in the organization. Each manager is a subscription row.

First month is free for both. During the trial, realtor organizations are limited to 1 manager.

## Data model

### `subscription` table

```
id                  serial PK
organization_id     text FK → organization.id
user_id             integer FK → user.id
status              integer (ACTIVE=0, GRACE=1, LOCKED=2)
type                integer (FREELANCE=0, REALTOR=1)
ends_at              timestamptz
starts_at            timestamptz
created_at          timestamptz
updated_at          timestamptz
```

Each row represents one seat. A freelance account has 1 row. A realtor organization with 5 managers has 5 rows — same `organization_id`, different `user_id`s, same period dates.

The `status` column exists but is secondary — the actual status is **computed from dates** at query time (see "Status resolution" below). The stored status serves as a snapshot but `current_period_end` is the source of truth.

**Mid-month seat swap**: When a manager is removed and another takes their place, the subscription row's `user_id` is updated. The seat transfers — no new row created, no row deleted. The realtor paid for that seat for the month, and someone fills it.

### `subscription_payment` table

Links a subscription renewal to the payment that funded it.

```
id                serial PK
subscription_id   integer FK → subscription.id
payment_id        integer FK → payment.id
created_at        timestamptz
```

### Constants

- `SUBSCRIPTION_STATUS`: `ACTIVE=0`, `GRACE=1`, `LOCKED=2` — in `$lib/subscription_status.ts`
- `SUBSCRIPTION_TYPE`: `FREELANCE=0`, `REALTOR=1` — in `$lib/subscription_type.ts`

Both follow the standard pattern: constant + type + schema + label function.

## Status resolution

Status is computed from `ends_at`, not from the stored `status` column:

```
ends_at > now                          → ACTIVE
ends_at <= now < ends_at + 7d          → GRACE
now >= ends_at + 7 days                → LOCKED
```

The `resolve_subscription_status(current_period_end)` function in `$lib/server/subscription.ts` is a pure function — it takes a Date and returns the computed status. No database query. The 7-day grace period is a constant (`GRACE_PERIOD_DAYS = 7`).

Why compute instead of store? Because a stored status requires a cron job or trigger to flip it when time passes. Computed status is always correct — there's no window where the database says "ACTIVE" but the period has actually ended. The tradeoff is a date comparison on every check, which is negligible.

## `locals.subscriptions`

All subscriptions for the authenticated user are fetched once per request in `hooks.server.ts` and stored in `event.locals.subscriptions`. This means:

- Every loader and action has access without a separate database query
- The query is `SELECT ... FROM subscription WHERE user_id = ?` — one indexed lookup per request
- Unauthenticated users get an empty array
- The data is fresh on every navigation (including SPA navigations, since the layout is server-side)

Type definition in `app.d.ts`:

```ts
subscriptions: {
  id: number
  organization_id: string
  user_id: number
  status: number
  type: number
  ends_at: string
  starts_at: string
}
;[]
```

## Subscription creation (onboarding)

When a user picks their account type on `/onboarding`, the card click submits a form with a hidden `type` field (0 for freelance, 1 for realtor). The `select_account_type` action:

1. Validates the type via `ForceNumberSchema` + `SubscriptionTypeSchema`
2. Looks up the user's personal organization (slug `personal-{user_id}`)
3. Creates a subscription row with `current_period_end = now + 30 days`
4. Redirects to `/admin/properties` (freelance) or `/demo` (realtor)

The free trial month starts immediately. No payment involved.

## Feature gating

### Grace period banner

When the subscription is in GRACE status, an unclosable `SubscriptionBanner` component appears below the header on every page. It shows how many days remain before lockout and links to `/subscribe`. Visible to ALL members of the organization, not just the admin.

The banner data flows through the root layout: `+layout.server.ts` calls `require_active_subscription(locals.subscriptions, active_organization_id)`, which returns `{ status: GRACE, days_remaining }` or `{ status: ACTIVE }`. The layout passes `subscription_grace` and `subscription_days_remaining` to `+layout.svelte`.

### Hard redirect (LOCKED)

When the subscription is LOCKED, `require_active_subscription` throws a `redirect(302, "/subscribe")`. This happens in the root layout loader, so every non-public route redirects. The user can still log in — they're just forced to the payment page.

Public routes are excluded from the check: `/login`, `/signup`, `/onboarding`, `/subscribe`, `/webhooks`, `/health`, `/api`, and `/` (landing page).

Non-admin members who land on `/subscribe` see "Tu administrador debe renovar la suscripción" instead of the payment form.

### Trial seat enforcement

During the free trial (no `subscription_payment` records exist for the organization), realtor organizations are limited to 1 manager. The `invite_manager` action checks this by:

1. Querying whether any `subscription_payment` records exist for the organization's subscription
2. If none (trial): counting members in the organization. If count >= 2 (realtor + 1 manager), the invitation is blocked with "Durante el período de prueba solo podés tener 1 administrador"

After the first payment, no seat limit is enforced — the renewal amount is simply `COUNT(subscription rows) × $40`.

## Renewal flow

### Manual renewal — why not automatic?

MercadoPago has a Preapproval API for automatic recurring billing, but we chose manual renewal for control. The flow:

1. **Cron sends reminder emails** (not payment links)
2. **Admin visits `/subscribe`** (from email link or from the hard redirect)
3. **`/subscribe` creates a fresh MercadoPago preference** on-demand
4. **Admin pays** via MercadoPago checkout
5. **Webhook publishes an `extend_subscription` event** to the message broker
6. **Consumer extends the subscription** by 1 month

### Why cron doesn't create MercadoPago preferences

MercadoPago preferences expire (typically 24-72 hours). If the cron created a preference and emailed the link, and the admin didn't pay in time, the link would be dead. Then we'd need logic to detect expired preferences, create new ones, email again — complexity for no benefit.

Instead, the cron only sends emails with a link to `/subscribe`. The `/subscribe` page creates a preference at the moment the admin clicks "pay". Always fresh, never stale.

### Cron: `create_renewal_jobs`

Runs daily at 8 AM (configured in Ofelia). Checks for expiring or grace-period organizations. If any exist and no Valkey lock is active (`lock:send_renewal_reminder`, 24h TTL), publishes a `send_renewal_reminder` event to the broker. The lock prevents duplicate sends if the cron fires twice in one day.

### Consumer handler: `send_renewal_reminder`

Processed by the broker consumer. For each organization with expiring subscriptions:

1. Counts seats (subscription rows) for the organization
2. Calculates display amount: freelance=$50, realtor=seats×$40
3. Finds the org admin (member with realtor or manager role)
4. Sends HTML email via the Go email service (`send_email`)
5. Pre-expiry emails: "Tu suscripción vence el {date}"
6. Grace emails: "Tu suscripción venció. Renová para evitar la interrupción del servicio."

### Payment page: `/subscribe`

The central payment page. Loader provides:

- Subscription status (computed from dates)
- Amount due (based on subscription type + seat count)
- Whether the current user is an admin

The `create_subscription_payment` action:

1. Counts seats via `fetch_organization_subscriptions`
2. Calculates amount: freelance=$50, realtor=seats×$40
3. Calls `create_preference()` with the amount and `/subscribe/*` back URLs
4. In a transaction: creates `payment`, `payment_mercado_pago`, and `subscription_payment` records
5. Redirects to MercadoPago checkout

### Webhook: publish, don't execute

When MercadoPago sends an "approved" webhook:

1. Existing flow: verify HMAC, fetch payment details, update `payment_mercado_pago.status`
2. Check if this payment has a `subscription_payment` record
3. If yes: publish an `extend_subscription` event to the broker with the `subscription_payment_id`
4. Return 200 immediately

The webhook does NOT mutate subscriptions directly. This is intentional — if the extension fails, the message retries up to 3 times and then lands in the dead letter queue for investigation. The webhook itself is fast and always succeeds (just a publish).

### Consumer handler: `extend_subscription`

Processed by the broker consumer:

1. Validates the message payload (`subscription_payment_id`)
2. Checks `subscription_payment.processed_at` — if not null, skips (idempotency guard)
3. Follows the FK chain: `subscription_payment` → `subscription` → `organization_id`
4. In a transaction: updates ALL subscription rows for the organization and sets `processed_at`:
   - `starts_at = ends_at`
   - `ends_at = ends_at + interval '1 month'`
5. On failure: retries up to 3 times, then routes to DLQ

All seats in the organization are extended together — one payment covers everyone. The `processed_at` guard prevents double-extension if the message is delivered more than once.

## What about adding/removing seats mid-month?

- **Adding a manager** (after trial): A new subscription row is created when the manager joins the organization. Their `current_period_end` matches the existing seats. At next renewal, the seat count is recalculated from actual rows.
- **Removing a manager**: The subscription row stays until `current_period_end`. The seat can be reassigned to another manager by updating `user_id` on the existing row. The organization doesn't lose what it paid for.
- **Renewal repricing**: At each renewal, the amount is `COUNT(subscription rows) × $40`. If a manager was removed and not replaced, there are fewer rows, and the next payment is cheaper.

## Files

### Database

- `db/migrations/1774231558814_add_subscription.ts` — `subscription`, `subscription_payment` tables with FKs and indexes
- `db/types.ts` — `Subscription`, `SubscriptionPayment` interfaces (generated)

### Constants

- `$lib/subscription_status.ts` — `SUBSCRIPTION_STATUS`, labels, schema
- `$lib/subscription_type.ts` — `SUBSCRIPTION_TYPE`, labels, schema

### Core logic

- `$lib/server/subscription.ts` — `resolve_subscription_status`, `get_grace_days_remaining`, `fetch_user_subscriptions`, `fetch_organization_subscriptions`, `require_active_subscription`
- `src/hooks.server.ts` — populates `locals.subscriptions`
- `src/app.d.ts` — `subscriptions` type on `App.Locals`

### Onboarding

- `routes/onboarding/+page.server.ts` — `select_account_type` action creates subscription
- `routes/onboarding/+page.svelte` — cards submit forms with hidden `type` field
- `routes/onboarding/actions/action.ts` — `ACTION.SELECT_ACCOUNT_TYPE`
- `routes/onboarding/actions/select_account_type.server.ts` — creates subscription with 30-day free period

### Feature gating

- `$lib/components/SubscriptionBanner.svelte` — unclosable banner for grace period
- `routes/+layout.server.ts` — runs `require_active_subscription`, passes grace data
- `routes/+layout.svelte` — renders `SubscriptionBanner` when in grace
- `routes/admin/realtor/actions/invite_manager.server.ts` — trial seat enforcement

### Cron & Broker

- `$lib/server/cron/create_renewal_jobs.ts` — finds expiring subscriptions, publishes `send_renewal_reminder` event
- `$lib/server/cron/create_renewal_jobs.script.ts` — entry point for Ofelia
- `$lib/server/cron/send_renewal_reminder.ts` — sends email to organization admin
- `$lib/server/cron/extend_subscription.ts` — `extend_subscription_by_payment_id()` with idempotency guard
- `$lib/server/broker/events/extend_subscription.ts` — event schema + topic name
- `$lib/server/broker/events/send_renewal_reminder.ts` — event schema + topic name
- `$lib/server/broker/consumer/handle_extend_subscription.ts` — consumer handler with retry/DLQ
- `$lib/server/broker/consumer/handle_send_renewal_reminder.ts` — consumer handler with retry/DLQ
- `infra/development/scheduler/ofelia.ini` — daily `create-renewal-jobs` at 8 AM
- `infra/production/scheduler/ofelia.ini` — same
- See `docs/broker.md` for full broker architecture

### Payment page

- `routes/subscribe/+page.server.ts` — loader + `create_subscription_payment` action
- `routes/subscribe/+page.svelte` — payment form with amount breakdown
- `routes/subscribe/actions/action.ts` — `ACTION.CREATE_SUBSCRIPTION_PAYMENT`
- `routes/subscribe/actions/create_subscription_payment.server.ts` — creates MercadoPago preference + payment records
- `routes/subscribe/success/+page.server.ts` — auth check
- `routes/subscribe/success/+page.svelte` — confirmation page

### Webhook

- `routes/webhooks/mercadopago/+server.ts` — publishes `extend_subscription` event on approved payment

### MercadoPago

- `$lib/server/mercado_pago_payment.ts` — `create_preference` now accepts optional `back_urls` for subscription flow

# /subscriptions/[subscription_id]/payments

## Loader

Requires auth. Resolves a single subscription owned by the authenticated user, plus its Mercado Pago payment history.

- Parses `params.subscription_id` via `ForceNumberSchema`.
- Looks up the subscription in `locals.subscriptions` (already filtered by user). 404 if not found — implicit ownership check.
- Resolves `status` and `can_pay_next` (within `PAY_WINDOW_DAYS` of `ends_at`, or status GRACE/LOCKED).
- Calls `fetch_subscription_payments([subscription_id])` from `$lib/server/subscription`.

## Actions

- `CREATE_SUBSCRIPTION_PAYMENT` — local action that delegates to the shared helper at `(centered)/subscriptions/actions/create_subscription_payment.server.ts`. Validates ownership of `organization_id` from form data, creates a Mercado Pago preference, redirects to MP `init_point`.

## Auth

Requires authenticated user. Ownership of the subscription is enforced via lookup against `locals.subscriptions`.

## Key Components

`Content`, `Table`, `Formulary`, `Button`.

## Notes

- Payment rows are inserted by the MercadoPago webhook on APPROVED status only. Pre-approval clicks do not write any rows.
- The Pagar button posts an `organization_id` hidden input; the action validates ownership before charging.

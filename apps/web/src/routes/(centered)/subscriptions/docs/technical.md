# /subscriptions

## Loader

Requires auth. Loads every subscription owned by the authenticated user, joined with their Mercado Pago payments.

- Sources subscriptions from `locals.subscriptions` (already populated in `hooks.server.ts`).
- Calls `fetch_subscription_payments(subscription_ids)` from `$lib/server/subscription` to fetch payments for those subscriptions.
- Groups payments by `subscription_id` and resolves `status` + `can_pay_next` per subscription.
- `can_pay_next` is `true` when status is GRACE/LOCKED, or when `ends_at` is within `PAY_WINDOW_DAYS` of now (uses `differenceInDays` from `date-fns`).

## Actions

- `CREATE_SUBSCRIPTION_PAYMENT` — local action wrapping `actions/create_subscription_payment.server.ts`. Validates the form's `organization_id`, verifies the user owns it via `locals.subscriptions`, then delegates to the shared MP payment helper at `(centered)/subscribe/actions/create_subscription_payment.server.ts`.

## Auth

Requires authenticated user. Ownership is enforced per-action: the form posts an `organization_id` and the action checks `locals.subscriptions.some(s => s.organization_id === organization_id)` before charging.

## Key Components

`Content`, `Card`, `Table`, `Formulary`, `Button`.

## Notes

- The Mercado Pago dashboard link uses `https://www.mercadopago.com.ar/activities/detail/{operation_id}`. `operation_id` is nullable until the webhook fires; pending payments render `—`.
- Payment rows are inserted by the MercadoPago webhook on APPROVED status only. Pre-approval clicks do not write any rows — abandoned MP flows leave no trace.

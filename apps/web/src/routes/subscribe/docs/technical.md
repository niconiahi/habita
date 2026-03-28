# /subscribe

## Loader
Requires auth. Resolves current subscription for the active organization:
- `has_subscription` — boolean
- `status` — via `resolve_subscription_status()`
- `ends_at` — subscription end date
- `amount` — calculated: $50 USD for freelance, `seat_count × $40 USD` for realtor
- `seat_count` — number of organization subscriptions
- `is_admin` — checks `member` table for `realtor` or `manager` role
- `subscription_type` — `FREELANCE` or `REALTOR`

## Actions
- `CREATE_SUBSCRIPTION_PAYMENT` — creates a Mercado Pago subscription payment for the active organization. Redirects to `init_point`.

## Auth
Requires authenticated user. Payment requires an active organization.

## Key Components
Content, Formulary, Button

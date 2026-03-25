# /pay/success

## Loader
Public (no auth required). Reads `preference_id` from URL params, looks up `payment_mercado_pago` record, and returns the payment status (`APPROVED`, `PENDING`, or rejected) with appropriate Spanish message.

## Actions
None.

## Notes
- Callback URL from Mercado Pago — user is redirected here after checkout
- Returns status + message + operation_id for display

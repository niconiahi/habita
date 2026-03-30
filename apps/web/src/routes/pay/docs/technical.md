# /pay

## Loader

Requires auth + `is_webmaster()` check. Returns 403 if not a webmaster.

## Actions

- `CREATE_PAYMENT` — calls `create_payment()` which creates a Mercado Pago preference and redirects to `init_point` (Mercado Pago checkout URL).

## Auth

Requires authenticated webmaster user.

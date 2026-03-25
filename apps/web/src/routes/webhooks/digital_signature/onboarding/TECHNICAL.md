# /webhooks/digital_signature/onboarding

## Endpoint (`+server.ts` — GET only)
Simple callback URL from Alpha2000 Firmador after certificate onboarding.

### Parameters
- `result` — `"ok"`, `"error"`, or `"rejected"` (validated via `ResultSchema`)

### Flow
- `ok` → redirect to `/digital_signature/success`
- `error` → redirect to `/digital_signature/error`
- `rejected` → redirect to `/digital_signature/rejected`

## Auth
None — callback URL from external service.

## Notes
- No database writes — purely a redirect router based on the result parameter

# /webhooks/digital_signature/signing

## Endpoint (`+server.ts` — GET only)
Callback URL from Alpha2000 Firmador after a signing attempt.

### Parameters (query string)
- `party` — `"landlord"` or `"tenant"` (validated via `PartySchema`)
- `result` — `"ok"`, `"error"`, or `"rejected"` (validated via `ResultSchema`)
- `contract_id` — number

### Flow
1. Maps `result` to `SIGNATURE_STATUS` (SIGNED, ERROR, REJECTED)
2. Updates `digital_signature` record: sets `landlord_status` or `tenant_status`
3. If `error` → redirect to `/digital_signature/error`
4. If `rejected` → redirect to `/digital_signature/rejected`
5. If both parties SIGNED:
   - Fetches signed PDF from Alpha2000 via `fetch_signed_document(document_id)`
   - In a transaction: stores signed PDF as `contract_file` (type SIGNED), sets contract state to `ACTIVE`
6. Redirects to `/digital_signature/success`

### Error handling
All `API_FETCH_ERROR` types are logged with context and redirect to error page.

## Auth
None — callback URL from external service. Security relies on the URL being only shared with the signing parties.

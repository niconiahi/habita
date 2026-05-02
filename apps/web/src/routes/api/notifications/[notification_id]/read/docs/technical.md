# /api/notifications/[notification_id]/read

## Endpoint (`+server.ts` — POST only)

Updates the `read_at` timestamp on a notification record.

### Flow

1. `require_authentication(locals)`
2. Parses `notification_id` via `ForceNumberSchema`
3. Updates `notification` table where `id` matches and `read_at is null` (idempotent)
4. Returns `{ ok: true }` or `{ error: "..." }` with HTTP 500

## Auth

Requires authenticated user.

## Notes

- Idempotent — won't re-update already read notifications
- Uses `safe_async()` for error handling
- Error messages in Spanish

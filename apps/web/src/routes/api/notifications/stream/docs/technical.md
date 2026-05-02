# /api/notifications/stream

## Endpoint (`+server.ts` — GET only)

Server-Sent Events (SSE) stream for real-time notifications.

### Flow

1. `require_authentication(locals)`
2. `get_accessible_property_ids()` with `MANAGER` access type
3. Opens `ReadableStream` with `text/event-stream` content type
4. Sends `: connected\n\n` initial message
5. Listens to `notification_emitter.on(NOTIFICATION_EVENT)` — filters by accessible property IDs
6. Cleans up event listener on client disconnect

## Auth

Requires authenticated user with manager access.

## Notes

- Headers set to prevent caching and maintain persistent connection
- Event listener cleanup on `cancel()` to prevent memory leaks

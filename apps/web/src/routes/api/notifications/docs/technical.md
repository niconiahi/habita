# /api/notifications

## Endpoint (`+server.ts` — GET only)

Returns JSON array of notifications for properties where the user has `ACCESS_TYPE.MANAGER`.

### Flow

1. `require_authentication(locals)`
2. `get_accessible_property_ids()` with `MANAGER` access type, scoped to active organization
3. Returns `[]` if no accessible properties
4. `fetch_notifications(property_ids)` from database

## Auth

Requires authenticated user with manager access to at least one property.

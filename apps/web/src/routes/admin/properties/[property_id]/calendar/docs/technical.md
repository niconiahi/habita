# /admin/properties/[property_id]/calendar

## Loader

Requires auth + `require_edit_access()`. Loads `slots` via `fetch_slots()` and `property` via `fetch_property()`. Returns 404 if property not found. Redirects to `/admin/properties` if property is not published.

## Actions

- `CREATE_SLOT` — creates a new visit time slot with `property_id` and `host_id` (current user)
- `DESTROY_SLOT` — removes a time slot

Both require `require_edit_access()`.

## Auth

Requires authenticated user with edit access (ACL).

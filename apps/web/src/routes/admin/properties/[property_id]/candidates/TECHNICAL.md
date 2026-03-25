# /admin/properties/[property_id]/candidates

## Loader
Requires auth + `require_edit_access()`. Loads `candidates` via `fetch_candidates(property_id)` and `property` via `fetch_property()`. Returns 404 if property not found.

## Actions
None — read-only page.

## Auth
Requires authenticated user with edit access (ACL) to the property.

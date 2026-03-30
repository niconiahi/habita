# /admin/candidates

## Loader

Requires auth. Gets all accessible property IDs via `get_accessible_property_ids()` with `LANDLORD` and `MANAGER` access types, then `fetch_candidates(property_ids)`.

## Actions

- `SET_TENANT` — promotes a candidate to tenant. Validates `property_id` from form data, checks `require_edit_access()`, then calls `set_tenant()`. Redirects on success.

## Auth

Requires authenticated user with landlord or manager access.

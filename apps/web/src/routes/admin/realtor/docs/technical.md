# /admin/realtor

## Loader

Requires auth. Checks `get_user_realtor_organization()` — returns 403 if user isn't a realtor. Loads in parallel:

- `organization` via `fetch_organization_details()`
- `managers` via `fetch_managers_with_property_counts()`

## Actions

- `INVITE_MANAGER` — sends invitation to join the agency. Requires realtor org ownership.
- `REMOVE_MANAGER` — removes a manager from the agency.
- `REASSIGN_PROPERTY` — transfers a property from one manager to another.

All actions verify realtor organization ownership.

## Auth

Requires authenticated user who owns a realtor organization. Returns 403 otherwise.

# /accesses

## Loader

Requires auth. Fetches `properties` — list of properties with `access_types` array for the current user.

## Actions

None — read-only page.

## Auth

Requires authenticated user.

## Notes

- Each property links to different views based on role: `/admin/properties/{id}/edit` (manager), `/properties/{id}/tenant` (tenant), `/properties/{id}/landlord` (landlord)

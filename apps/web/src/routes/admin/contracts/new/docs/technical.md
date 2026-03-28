# /admin/contracts/new

## Loader
Requires auth. Gets accessible property IDs (`LANDLORD` + `MANAGER`), then `fetch_available_properties()` to show only properties that can receive new contracts.

## Actions
- `default` — receives `property_id` from form, validates it exists, and redirects to `/admin/properties/{property_id}/contracts/new`.

## Auth
Requires authenticated user with landlord or manager access.

## Notes
- This is a routing step — the actual contract creation form lives at `/admin/properties/[property_id]/contracts/new`

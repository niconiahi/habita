# /admin/notifications

## Loader

Requires auth. Gets accessible property IDs with `MANAGER` access type, then `fetch_all_notifications(property_ids)`. Returns empty array if no accessible properties.

## Actions

None — read-only page.

## Auth

Requires authenticated user with manager access to at least one property.

## Notes

- Notifications grouped by day via `group_by_day()` utility
- Read notifications rendered with reduced opacity (0.6)
- Each notification has an `href` pointing to relevant context
- Dates formatted in Spanish locale using `date-fns`

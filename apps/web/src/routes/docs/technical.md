# /

## Layout (`+layout.server.ts` / `+layout.svelte`)

Root layout that wraps every page. Loads:

- `notifications` — via `fetch_notifications()` for managers (users with `ACCESS_TYPE.MANAGER` on any property)
- `is_manager` — boolean derived from `get_accessible_property_ids()`
- `organizations` — via `get_user_selectable_organizations()` for the org switcher
- `subscription_grace` / `subscription_days_remaining` — via `resolve_subscription_status()` + `get_grace_days_remaining()` to show the expiration banner

## Page (`+page.svelte`)

Static placeholder page with a link to `/properties`. No loader, no actions.

## Key Components

Header, SubscriptionBanner

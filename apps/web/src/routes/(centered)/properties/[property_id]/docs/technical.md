# /properties/[property_id]

## Loader

Fetches:

- `property` — full property with floors, rooms, photos, tags, services
- `manager` — administrator details (if assigned)
- `organization` — realtor organization (if manager has one)
- `has_credit_report` — for current user (if logged in)
- Photo URLs with responsive image props

Returns 404 if not found.

## Actions

None — read-only page.

## Auth

None — public page. Some data (credit report check) requires optional auth.

## Key Components

Visualizer, PropertyMap, PhotoViewer, AdminCard, OrganizationCard, PricingCard, TabGroup

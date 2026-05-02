# /properties

## Loader

Fetches `properties` (published, with images, pricing, location), `filters` (from URL params), `zone_items`, `selected_zone`.

## Actions (1 total)

- `SET_FILTERS` — applies filters and redirects with updated URL params

## Auth

None — public page.

## Key Components

PropertyCard, RangeFilter, ToggleButton, ZoneInput, Dialog

## Notes

- Filters persisted as URL params for shareability
- Property cards in 3-column responsive grid
- Filter dialog uses native `<dialog>`

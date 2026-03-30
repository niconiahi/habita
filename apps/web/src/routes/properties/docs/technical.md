# /properties

## Loader

Public page (no auth required). Loads:

- `properties` — via `fetch_properties()` from `$lib/server/fetchers/properties`, filtered by zone, tag types, service types, and numeric ranges (ambientes, dormitorios, baños, total_surface, construction_year). Images are processed through `get_img_props()` for responsive srcSet.
- `filters` — parsed from URL search params via `parse_filters(url)`
- `zone_items` / `selected_zone` — via `fetch_zones()` for the zone autocomplete

## Actions

- `SET_FILTERS` — receives filter values from form, calls `set_filters()` which builds a redirect URL with the new filter params.

## Key Components

Content, Card (Root/Carousel/Body/Title/Actions/Content), ZoneInput, RangeFilter, PropertyTag, Button

## Notes

- Filters are stored in URL search params — each filter change submits a form that redirects with updated params
- Tag toggling uses `toggle_id()` to add/remove tag IDs from a comma-separated string
- Images use responsive `srcSet` with widths [400, 800]

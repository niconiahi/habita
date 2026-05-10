# /admin/properties/[property_id]/edit/characteristics

## Loader

No page-level loader. All data comes from parent layout (`property`).

## Actions (6 total)

- `UPDATE_LOCATION` — updates property address and coordinates
- `UPDATE_DESTINIES` — toggles property destiny types
- `UPDATE_CONSTRUCTION_YEAR` — sets construction year
- `CREATE_SERVICE` / `UPDATE_SERVICE` / `DESTROY_SERVICE` — CRUD for utility services

All actions import from parent `/edit/actions/`.

## Remote forms

- `update_property_tags` (`./forms/update_property_tags.remote.ts`) — replaces the property's tag set in one transaction; submitted via the Tags section's "Guardar tags" button with `enhance` + `invalidateAll`.

## Auth

Inherited from parent layout (`require_edit_access()`).

## Key Components

Disclosure, Formulary, LocationInput, Button

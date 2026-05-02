# /admin/properties/[property_id]/edit/characteristics

## Loader

No page-level loader. All data comes from parent layout (`property`).

## Actions (7 total)

- `UPDATE_LOCATION` — updates property address and coordinates
- `UPDATE_DESTINIES` — toggles property destiny types
- `TOGGLE_TAG` — adds/removes a property tag
- `UPDATE_CONSTRUCTION_YEAR` — sets construction year
- `CREATE_SERVICE` / `UPDATE_SERVICE` / `DESTROY_SERVICE` — CRUD for utility services

All actions import from parent `/edit/actions/`.

## Auth

Inherited from parent layout (`require_edit_access()`).

## Key Components

Disclosure, Formulary, LocationInput, Button

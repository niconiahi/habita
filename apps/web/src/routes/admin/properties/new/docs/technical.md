# /admin/properties/new

## Loader

Requires auth. Returns `property_types` via `get_property_types()` and `property_destinies` via `get_property_destinies()`.

## Actions

- `CREATE_PROPERTY` — receives location, type, unit (optional), and destiny checkboxes. Injects `user_id` and `organization_id` from locals. Calls `create_property()` and redirects to the returned path (edit page).

## Auth

Requires authenticated user.

## Key Components

Content, Section, Formulary, LocationInput, Button

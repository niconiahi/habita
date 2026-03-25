# /admin/properties/[property_id]/edit

## Loader
Requires auth + `require_edit_access()` (ACL). Fetches `property` via `fetch_property()`. Returns 404 if not found. Redirects to `/admin/properties` if property state is `RENTED`.

## Actions (12 total)
- `UPDATE_LOCATION` — updates property location
- `CREATE_ROOM` / `UPDATE_ROOM` / `DESTROY_ROOM` / `UPDATE_ROOM_POSITIONS` — full CRUD for rooms + drag-and-drop reordering
- `CREATE_SERVICE` / `UPDATE_SERVICE` / `DESTROY_SERVICE` — CRUD for utility services
- `CREATE_PROPERTY_FILE` — upload property images/files
- `INVITE_LANDLORD` — sends invitation email to a landlord
- `UPDATE_DESTINIES` — updates property destiny checkboxes
- `TOGGLE_TAG` — toggles a property tag on/off
- `UPDATE_CONSTRUCTION_YEAR` — sets construction year

All actions require `require_edit_access()`.

## Auth
Requires authenticated user with edit access (ACL) to the property.

## Key Components
LocationInput, RoomMap, Formulary, PropertyTag, TypedFileUploadButton, Button

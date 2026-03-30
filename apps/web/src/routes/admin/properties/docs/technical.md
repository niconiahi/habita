# /admin/properties

## Loader

Requires auth. Gets properties via `get_accessible_property_ids()` filtered by `ACCESS_TYPE.LANDLORD` and `ACCESS_TYPE.MANAGER` for the active organization, then `fetch_properties()`.

## Actions

- `PUBLISH_PROPERTY` — changes property state to published. Requires `require_edit_access()` on the property.
- `UNPUBLISH_PROPERTY` — changes property state back to editing. Requires `require_edit_access()`.

## Auth

Requires authenticated user with landlord or manager access to properties.

## Key Components

Content, Section, Table (Root/Header/Body/Row/Cell), Button

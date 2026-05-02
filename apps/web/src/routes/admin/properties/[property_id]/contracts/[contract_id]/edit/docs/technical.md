# /admin/properties/[property_id]/contracts/[contract_id]/edit (layout)

## Layout (`+layout.server.ts`)

Requires auth + `require_edit_access()`. Loads in parallel:

- `contract` via `fetch_contract()` — includes nested periods, files, and contract_items
- `property` via `fetch_property()` — includes location and destinies
- `warranty` via `fetch_warranty()` — includes property_warranty, income_warranty, surety_warranty
- `signature` via `fetch_signature()` — digital signature record with landlord/tenant URLs and statuses

Returns 404 if contract or property not found.

## Layout (`+layout.svelte`)

Tab navigation with 4 subroutes: secciones, documentos, periodos, acciones. Displays breadcrumb with property location and contract ID.

## Page (`+page.server.ts`)

Redirects 302 to `/sections` (default tab).

## Auth

Requires authenticated user with edit access (ACL) to the property.

## Notes

- All 18 actions are defined in a shared `/edit/actions/` directory
- `fetch_signature()` is defined inline in fetchers (not in a separate lib fetcher)

# /admin/properties/[property_id]/edit (layout)

## Layout (`+layout.server.ts`)

Requires auth + `require_edit_access()` (ACL). Fetches `property` via `fetch_property()`. Returns 404 if not found.

## Layout (`+layout.svelte`)

Tab navigation with 6 subroutes: caracteristicas, disposicion, visitas, contratos, miembros, comprobantes. Displays breadcrumb with property location.

## Page (`+page.server.ts`)

Redirects 302 to `/characteristics` (default tab).

## Auth

Requires authenticated user with edit access (ACL) to the property.

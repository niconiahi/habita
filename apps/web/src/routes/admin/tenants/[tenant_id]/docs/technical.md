# /admin/tenants/[tenant_id]

## Loader

Requires auth. Verifies access via `is_tenant_accessible(tenant_id, manager_property_ids)` — checks the tenant is on one of the manager's properties. Returns 403 if not authorized, 404 if not found. Loads `tenant` via `fetch_tenant_by_id()`.

## Actions

None — read-only page.

## Auth

Requires authenticated user with landlord or manager access. Tenant must be associated with one of their properties.

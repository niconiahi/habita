# /admin/properties/[property_id]/contracts/new

## Loader
Requires auth + `require_edit_access()`. Returns `contract_types` via `get_contract_types()`.

## Actions
- `CREATE_CONTRACT` — creates a new contract for the property. Calls `create_contract(form_data, property_id)` and redirects to the edit page.

## Auth
Requires authenticated user with edit access (ACL) to the property.

# /admin/properties/[property_id]/contracts/[contract_id]/edit/documents

## Loader

Fetches `tenant_insurance_files` via `fetch_tenant_insurance_files(property_id)`. Contract files come from parent layout (`contract.files`).

## Actions (2 total)

- `CREATE_FILE` — uploads a contract file
- `DESTROY_FILE` — deletes a contract file by ID

All actions import from parent `/edit/actions/`.

## Auth

Inherited from parent layout (`require_edit_access()`).

## Key Components

Button

## Notes

- File type display uses `get_contract_file_type_label()`
- Property validation errors shown when PDF generation failed
- Tenant insurance files are read-only (from tenant user profile)
- Download links point to `/files/{id}`

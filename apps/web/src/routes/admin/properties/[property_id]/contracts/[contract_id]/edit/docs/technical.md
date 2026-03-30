# /admin/properties/[property_id]/contracts/[contract_id]/edit

## Loader

Requires auth + `require_edit_access()`. Loads in parallel:

- `contract` via `fetch_contract()`
- `property` via `fetch_property()`
- `landlord` via `fetch_landlord()`
- `tenant` via `fetch_tenant()`
- `warranty` via `fetch_warranty()`
- `signature` via `fetch_signature()` (digital signature status)
- `contract_file_types` via `get_contract_file_types()`

Returns 404 if contract or property not found.

## Actions (18 total)

Contract: `UPDATE_CONTRACT`
Files: `CREATE_FILE`, `DESTROY_FILE`, `CREATE_PDF`
Items: `CREATE_CONTRACT_ITEM`, `UPDATE_CONTRACT_ITEM`, `DESTROY_CONTRACT_ITEM`, `CREATE_CONTRACT_ITEM_FILE`, `DESTROY_CONTRACT_ITEM_FILE`
Periods: `UPDATE_PERIOD`, `CREATE_PERIOD`
Warranty: `CREATE_WARRANTY`, `UPDATE_WARRANTY`
Guarantors: `ADD_INCOME_GUARANTOR`, `UPDATE_INCOME_GUARANTOR`, `DESTROY_INCOME_GUARANTOR`
Digital signatures: `CHECK_CERTIFICATES`, `START_ONBOARDING`, `SEND_FOR_SIGNING`, `VERIFY_SIGNATURE`

All actions require `require_edit_access()`.

## Auth

Requires authenticated user with edit access (ACL) to the property.

## Notes

- This is the largest action file in the codebase (~670 lines)
- Digital signature actions integrate with Alpha2000 Firmador API
- `fetch_signature()` is defined inline (not in a separate fetcher file)

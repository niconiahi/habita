# /admin/properties/[property_id]/contracts/[contract_id]/tenant

## Loader
Requires auth + `require_property_access()` with `ACCESS_TYPE.TENANT` and `property: ["read"]` permission. Loads:
- `contract` via `fetch_contract()`
- `property` via `fetch_property()`
- `receipts` — from `receipt` table joined with `file`, filtered to last 2 months via `subMonths()`
- `current_rent_price` — derived from latest period's price
- `dates` — current month and previous month for receipt upload
- `receipt_types` — filtered by property's actual service types + always includes RENT

## Actions
- `UPLOAD_RECEIPT` — uploads a payment receipt file. Requires `require_property_access()` with tenant access.

## Auth
Requires authenticated user with **tenant** access to the property (not manager/landlord).

## Notes
- Receipt types are dynamically filtered based on which services the property actually has
- Only receipts from the last 2 months are shown

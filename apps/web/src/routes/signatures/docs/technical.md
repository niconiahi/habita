# /signatures

## Loader

Requires auth. Calls `fetch_signature_documents()` which joins `contract` → `property` → `location` → `property_access` → `digital_signature`. Filters by:

- User has `LANDLORD` or `TENANT` access on the property
- A `digital_signature` record exists for the contract

Returns: `contract_id`, `contract_state`, location fields, `access_type`, `landlord_status`, `tenant_status`, `landlord_url`, `tenant_url`.

## Actions

None — read-only page.

## Auth

Requires authenticated user. Shows only documents where user has landlord or tenant access.

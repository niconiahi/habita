# /properties/[property_id]/tenant (layout)

## Layout (`+layout.server.ts`)

Requires auth + validates user is a `TENANT` on the property. Loads:

- `contract` — active contract for the property
- `manager` — property administrator info
- `services` — list of services for the property
- `contract_files` — signed/contract files
- `contract_end_date`
- `periods` — sorted rental periods
- `current_rent_price` — latest period price

## Layout (`+layout.svelte`)

Tab navigation with 3 subroutes: contrato, comprobantes, servicios.

## Page (`+page.svelte`)

Displays contract info, manager contact (WhatsApp link), current rent price, and historical rental periods. Read-only.

## Auth

Requires authenticated user with tenant access to the property.

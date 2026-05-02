# /admin/properties/[property_id]/contracts/[contract_id]/edit/sections

## Loader

No page-level loader. All data comes from parent layout (`contract`, `property`, `warranty`).

## Actions (11 total)

Contract: `UPDATE_CONTRACT` — updates destiny, dates, escalation, cbu, fine_amount, percentage_return, early_termination, showroom_hours, court_id
Items: `CREATE_CONTRACT_ITEM`, `UPDATE_CONTRACT_ITEM`, `DESTROY_CONTRACT_ITEM`
Item files: `CREATE_CONTRACT_ITEM_FILE`, `DESTROY_CONTRACT_ITEM_FILE`
Warranty: `CREATE_WARRANTY`, `UPDATE_WARRANTY`
Guarantors: `ADD_INCOME_GUARANTOR`, `UPDATE_INCOME_GUARANTOR`, `DESTROY_INCOME_GUARANTOR`

All actions import from parent `/edit/actions/`.

## Auth

Inherited from parent layout (`require_edit_access()`).

## Key Components

Disclosure, Formulary, LocationInput, Button, Dialog

## Notes

- Warranty form dynamically renders based on type: PROPERTY (cadastral details), SURETY (company/policy), INCOME (guarantor list)
- Contract items support photo upload via hidden file input
- Dialog pattern for adding income guarantors
- Uses `compose_action()` to build action URLs

# /admin/properties/[property_id]/contracts/[contract_id]/edit/periods

## Loader

No page-level loader. Period data comes from parent layout (`contract.periods`).

## Actions (2 total)

- `CREATE_PERIOD` — creates the first period with initial price
- `UPDATE_PERIOD` — updates the first period's price

All actions import from parent `/edit/actions/`.

## Auth

Inherited from parent layout (`require_edit_access()`).

## Key Components

Formulary, Button

## Notes

- Two-state UI: creation form when no periods exist, display view otherwise
- Only the first period is editable; subsequent periods are read-only

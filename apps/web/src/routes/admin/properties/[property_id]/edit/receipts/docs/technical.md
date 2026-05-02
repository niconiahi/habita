# /admin/properties/[property_id]/edit/receipts

## Loader

Fetches receipts via direct query builder join across `receipt`, `file`, and `contract` tables, filtered by `property_id`.

## Actions (1 total)

- `DELETE_RECEIPT` — deletes a receipt (restricted to current month)

Action defined in local `/receipts/actions/` directory.

## Auth

Inherited from parent layout (`require_edit_access()`).

## Key Components

Table, Button, Dialog

## Notes

- Deletion restricted to receipts from the current month only
- Confirmation dialog before deletion via `use:enhance`
- File download links point to `/files/{id}`

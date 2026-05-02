# /admin/properties/[property_id]/edit/visits

## Loader

Fetches `slots` via `fetch_slots(property_id)`.

## Actions (4 total)

- `CREATE_SLOT` — creates a new visit time slot
- `DESTROY_SLOT` — deletes a free slot
- `CONFIRM_SLOT` — confirms a reserved slot
- `REJECT_SLOT` — rejects a reserved slot

Actions defined in local `/visits/actions/` directory.

## Auth

Inherited from parent layout (`require_edit_access()`).

## Key Components

Table, Button, Dialog

## Notes

- Slot actions are state-dependent: delete only for `FREE`, confirm/reject only for `RESERVED`
- Dialog closes automatically after slot creation via `use:enhance`

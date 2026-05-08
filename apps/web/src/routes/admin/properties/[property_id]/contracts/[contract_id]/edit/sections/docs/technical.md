# /admin/properties/[property_id]/contracts/[contract_id]/edit/sections

## Loader

No page-level loader. All data comes from parent layout (`contract`, `property`, `warranty`).

## Mutations

All mutations are SvelteKit remote forms in `./forms/*.remote.ts`. Each is one intent; the previous fat `update_contract` action is split into 9 narrow per-section forms.

Contract sections (one form each):
`update_contract_destiny`, `update_contract_term`, `update_contract_canon`, `update_contract_payment`, `update_contract_fine`, `update_contract_return`, `update_contract_early_termination`, `update_contract_showroom`, `update_contract_jurisdiction`

Items: `create_contract_item`, `update_contract_item`, `destroy_contract_item`
Item files: `create_contract_item_file`, `destroy_contract_item_file`
Warranty (per-type): `create_property_warranty`, `create_income_warranty`, `create_surety_warranty`, `update_property_warranty`, `update_income_warranty`, `update_surety_warranty`
Guarantors: `add_income_guarantor`, `update_income_guarantor`, `destroy_income_guarantor`

## Auth

Each remote form calls `require_contract_edit_access_remote({ contract_id, property_id })` from `$lib/server/auth/`. It runs `require_authentication`, `require_edit_access`, and an inline contract-editable guard, throwing `error()` on failure.

## Key Components

Disclosure, LocationInput, Button, Dialog. Forms are plain `<form><label><input/></form>` styled by `$lib/styles/form.css`.

## Notes

- Warranty type dictates which `create_*` / `update_*` form is rendered (separate forms per type since field shapes differ).
- Contract items support photo upload via hidden file input + `multipart/form-data` remote form.
- Per-row forms use `update_contract_item.for(id).enhance(...)` so each row has independent `pending`/`result`.
- Validation errors surface via `form.fields.<name>.issues()`. Execution errors throw `error()` and surface via inline `submit_error` state set inside `.enhance(...)` catch blocks.

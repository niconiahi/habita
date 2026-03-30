# /admin/contracts

## Loader

Requires auth. Gets accessible property IDs (`LANDLORD` + `MANAGER`). Parses optional `?state=` URL param via `ContractStateSchema` to filter contracts. Loads `contracts` via `fetch_contracts(property_ids, states)`.

## Actions

- `SET_STATE` — changes a contract's state. Calls `set_state()` which builds a redirect URL with the new state param.

## Auth

Requires authenticated user with landlord or manager access.

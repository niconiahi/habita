# /admin/candidates/[candidate_id]

## Loader
Requires auth. Verifies authorization by checking:
1. Gets manager's accessible property IDs (`LANDLORD` + `MANAGER`)
2. Confirms the candidate has a `SLOT_STATE.RESERVED` slot on one of those properties
3. Returns 403 if no matching slot found, 404 if candidate not found

Loads `candidate` via `fetch_candidate()`.

## Actions
None — read-only page.

## Auth
Requires authenticated user. Access is verified through slot reservation cross-check with manager's properties.

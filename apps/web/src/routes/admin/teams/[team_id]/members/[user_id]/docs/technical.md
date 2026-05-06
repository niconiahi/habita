# /admin/teams/[team_id]/members/[user_id]

## Loader

Requires auth. Checks `get_user_realtor_organization()` — returns 403 if not a realtor. Then:

- `fetch_team(team_id, organization_id)` — guarantees the team belongs to the realtor's org. Returns 404 on miss.
- Parses `user_id` to a number; returns 404 on parse failure.
- `fetch_team_member(team_id, user_id)` — guarantees the member belongs to that team. Returns 404 on miss.
- Parallel: `fetch_managed_properties(user_id)` (joined `property_access` → `property` → `location` filtered to `type = MANAGER`) and `fetch_team_peers(team_id, exclude_user_id)` for the reassign dropdown.

## Actions

- `REASSIGN_PROPERTY` — same shape as `/admin/realtor/REASSIGN_PROPERTY`. Validates `property_id` (required) and `new_manager_id` (optional). Revokes all `MANAGER` access on the property, then assigns the new manager if one was chosen. Leaving `new_manager_id` empty unassigns the property.

## Auth

Requires authenticated realtor whose org owns the team, and the member must belong to that team. Returns 403/404 otherwise.

## Data model notes

- The peers list is scoped to the same team — reassigning a property to someone outside the team would silently break the "members of a team" association assumption. Cross-team reassignment is a follow-up.

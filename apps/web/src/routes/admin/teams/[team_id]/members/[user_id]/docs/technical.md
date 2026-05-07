# /admin/teams/[team_id]/members/[user_id]

## Loader

Requires auth. Calls `require_active_realtor_organization(activeOrganizationId, subscriptions)` — 403s unless the user owns a `REALTOR` subscription for the **active** organization. Then:

- `fetch_team(team_id, organization_id)` — guarantees the team belongs to the active realtor org. Returns 404 on miss.
- Parses `user_id` to a number; returns 404 on parse failure.
- `fetch_team_member(team_id, user_id)` — guarantees the member belongs to that team. Returns 404 on miss.
- Parallel: `fetch_managed_properties(user_id)` (joined `property_access` → `property` → `location` filtered to `type = MANAGER`) and `fetch_team_peers(team_id, exclude_user_id)` for the reassign dropdown.

## Actions

- `REASSIGN_PROPERTY` — validates `property_id` (required) and `new_manager_id` (optional). Revokes all `MANAGER` access on the property, then assigns the new manager if one was chosen. Leaving `new_manager_id` empty unassigns the property.

## Auth

Requires authenticated user who owns a `REALTOR` subscription for the **active** organization. The team must belong to that active organization, and the member must belong to that team. Returns 403/404 otherwise.

## Key components

- `<div class="page">` + `<div class="header">` + `<h1 class="heading-md title">` mirroring `/admin/properties` (h1 = member display name).
- `Breadcrumb` with three segments: Equipos → team → member.
- A single shared `Dialog` for reassignment; the active row is tracked via `pending_property_id` `$state` and submitted as a hidden input. Keeps DOM small (one `<dialog>`) regardless of property count.
- `Table` for the managed-properties list with a `Reasignar` button per row that opens the modal.

## Data model notes

- The peers list is scoped to the same team — reassigning a property to someone outside the team would silently break the "members of a team" association assumption. Cross-team reassignment is a follow-up.

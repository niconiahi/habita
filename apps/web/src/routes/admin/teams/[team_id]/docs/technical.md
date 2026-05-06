# /admin/teams/[team_id]

## Loader

Requires auth. Checks `get_user_realtor_organization()` — returns 403 if the user isn't a realtor. Then:

- Loads the team via `fetch_team(team_id, organization_id)`. The `organization_id` filter is the security boundary — it guarantees a realtor can only view their own org's teams. Returns 404 on miss.
- Loads members via `fetch_team_members_with_property_counts(team_id)` — joins `team_member` with `user` and aggregates `property_access` (where `type = MANAGER`) for the property count column.

## Actions

- `INVITE_TO_TEAM` — inserts a row into `invitation` with `team_id` set so the acceptance flow can place the new user in this team. Validates email. Email delivery is not yet implemented (same TODO as `/admin/realtor/INVITE_MANAGER`).
- `REMOVE_FROM_TEAM` — deletes the `team_member` row. **Blocked** if the user has any `property_access (type=MANAGER)` rows: returns `fail(400)` with a message asking to reassign first. Org membership and property access are intentionally untouched.

All actions re-verify realtor org ownership and that the team belongs to that org.

## Auth

Requires authenticated user who owns a realtor organization, and the team must belong to that organization. Returns 403/404 otherwise.

## Data model notes

- "Properties of a member" is computed via `property_access (user_id, type=MANAGER)`. There is no direct `property.team_id` lookup in this loader — the chain is property → manager → team.
- The `invitation.team_id` column was added in migration `1778089630640_add_team_id_to_invitation` (nullable so existing org-level invitations still work).
